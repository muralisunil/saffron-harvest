import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundRequest {
  orderId: string;
  refundType: "full" | "partial_amount" | "item_cancellation";
  amount?: number;
  reason?: string;
  cancelledItems?: Array<{
    orderItemId: string;
    quantity: number;
    refundAmount: number;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Admin access required");

    const { orderId, refundType, amount, reason, cancelledItems }: RefundRequest = await req.json();
    console.log("[PROCESS-REFUND] Request:", { orderId, refundType, amount, reason, cancelledItems });

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    console.log("[PROCESS-REFUND] Order found:", order.order_number);

    // Calculate refund amount
    let refundAmount: number;
    if (refundType === "full") {
      refundAmount = Number(order.total_amount) - Number(order.refund_amount || 0);
    } else if (refundType === "partial_amount") {
      refundAmount = amount || 0;
    } else if (refundType === "item_cancellation" && cancelledItems) {
      refundAmount = cancelledItems.reduce((sum, item) => sum + item.refundAmount, 0);
    } else {
      throw new Error("Invalid refund configuration");
    }

    if (refundAmount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    const maxRefundable = Number(order.total_amount) - Number(order.refund_amount || 0);
    if (refundAmount > maxRefundable) {
      throw new Error(`Refund amount exceeds maximum refundable: $${maxRefundable.toFixed(2)}`);
    }

    console.log("[PROCESS-REFUND] Refund amount:", refundAmount);

    // Process Stripe refund if payment was made via Stripe
    let stripeRefundId: string | null = null;
    if (order.stripe_payment_intent_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: "requested_by_customer",
      });

      stripeRefundId = refund.id;
      console.log("[PROCESS-REFUND] Stripe refund created:", stripeRefundId);
    }

    // Record refund in database
    const { data: refundRecord, error: refundError } = await supabaseClient
      .from("order_refunds")
      .insert({
        order_id: orderId,
        stripe_refund_id: stripeRefundId,
        amount: refundAmount,
        reason: reason || null,
        refund_type: refundType,
        refunded_items: cancelledItems || [],
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (refundError) {
      console.error("[PROCESS-REFUND] Error recording refund:", refundError);
      throw new Error("Failed to record refund");
    }

    // Update order totals
    const newRefundTotal = Number(order.refund_amount || 0) + refundAmount;
    const isFullyRefunded = newRefundTotal >= Number(order.total_amount);

    const orderUpdate: Record<string, unknown> = {
      refund_amount: newRefundTotal,
      updated_at: new Date().toISOString(),
    };

    if (isFullyRefunded) {
      orderUpdate.status = "refunded";
      orderUpdate.payment_status = "refunded";
      orderUpdate.refunded_at = new Date().toISOString();
    } else if (refundType === "full" || (cancelledItems && cancelledItems.length > 0)) {
      // Partial refund or cancellation
      orderUpdate.payment_status = "refunded";
    }

    if (refundType === "full") {
      orderUpdate.status = "cancelled";
      orderUpdate.cancelled_at = new Date().toISOString();
    }

    await supabaseClient
      .from("orders")
      .update(orderUpdate)
      .eq("id", orderId);

    // Update order items if item cancellation
    let cancelledItemDetails: Array<{
      productName: string;
      variantName?: string;
      quantity: number;
      refundAmount: number;
    }> = [];

    if (refundType === "item_cancellation" && cancelledItems) {
      for (const item of cancelledItems) {
        const { data: existingItem } = await supabaseClient
          .from("order_items")
          .select("cancelled_quantity, refunded_amount, product_name, variant_name")
          .eq("id", item.orderItemId)
          .single();

        if (existingItem) {
          await supabaseClient
            .from("order_items")
            .update({
              cancelled_quantity: (existingItem.cancelled_quantity || 0) + item.quantity,
              refunded_amount: Number(existingItem.refunded_amount || 0) + item.refundAmount,
            })
            .eq("id", item.orderItemId);

          cancelledItemDetails.push({
            productName: existingItem.product_name,
            variantName: existingItem.variant_name || undefined,
            quantity: item.quantity,
            refundAmount: item.refundAmount,
          });
        }
      }
    }

    console.log("[PROCESS-REFUND] Refund completed successfully");

    // Send refund notification email if customer email exists
    if (order.shipping_email) {
      const isFullyCancelled = refundType === "full" || isFullyRefunded;
      const remainingTotal = Number(order.total_amount) - newRefundTotal;

      console.log("[PROCESS-REFUND] Sending refund email to:", order.shipping_email);

      try {
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-refund-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              orderId,
              customerEmail: order.shipping_email,
              customerName: order.shipping_name || "Customer",
              orderNumber: order.order_number,
              refundType,
              refundAmount,
              reason: reason || undefined,
              cancelledItems: cancelledItemDetails.length > 0 ? cancelledItemDetails : undefined,
              isFullyCancelled,
              remainingTotal,
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error("[PROCESS-REFUND] Failed to send email:", await emailResponse.text());
        } else {
          console.log("[PROCESS-REFUND] Refund email sent successfully");
        }
      } catch (emailError) {
        console.error("[PROCESS-REFUND] Email sending error:", emailError);
        // Don't fail the refund if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund: refundRecord,
        stripeRefundId,
        newRefundTotal,
        isFullyRefunded,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[PROCESS-REFUND] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
