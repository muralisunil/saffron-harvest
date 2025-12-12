import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  productId: string;
  productName: string;
  variantSize: string;
  quantity: number;
  price: number;
}

interface CartSession {
  id: string;
  session_id: string;
  cart_items: CartItem[];
  cart_total: number;
  abandoned_at: string;
  user_id: string | null;
  recovery_email_sent_at: string | null;
}

// Configuration
const ABANDONMENT_THRESHOLD_HOURS = 1; // Send recovery email after 1 hour of abandonment
const STORE_NAME = "Desi Pantry";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Auto Cart Recovery Cron Job Started ===");
  console.log("Time:", new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the threshold time
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - ABANDONMENT_THRESHOLD_HOURS);

    console.log("Looking for carts abandoned before:", thresholdTime.toISOString());

    // Find abandoned carts that:
    // 1. Are marked as abandoned
    // 2. Haven't completed checkout
    // 3. Haven't received a recovery email yet
    // 4. Were abandoned more than threshold hours ago
    // 5. Have items in the cart (cart_total > 0)
    const { data: abandonedCarts, error: fetchError } = await supabase
      .from("cart_sessions")
      .select("*")
      .eq("abandoned", true)
      .eq("checkout_completed", false)
      .is("recovery_email_sent_at", null)
      .lt("abandoned_at", thresholdTime.toISOString())
      .gt("cart_total", 0)
      .limit(50); // Process up to 50 carts per run

    if (fetchError) {
      console.error("Error fetching abandoned carts:", fetchError);
      throw new Error("Failed to fetch abandoned carts");
    }

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts to process`);

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No abandoned carts to process",
          processed: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.lovable.app";

    for (const cart of abandonedCarts as CartSession[]) {
      results.processed++;

      // Get user email - we need to look this up from the profiles or orders table
      // For now, we'll check if there's an email in the orders table for this user
      let userEmail: string | null = null;

      if (cart.user_id) {
        // Try to get email from recent orders
        const { data: recentOrder } = await supabase
          .from("orders")
          .select("shipping_email")
          .eq("user_id", cart.user_id)
          .not("shipping_email", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (recentOrder?.shipping_email) {
          userEmail = recentOrder.shipping_email;
        }
      }

      if (!userEmail) {
        console.log(`Skipping cart ${cart.id}: No email found for user`);
        results.skipped++;
        continue;
      }

      try {
        // Generate cart items HTML
        const cartItems = cart.cart_items as CartItem[];
        const cartItemsHtml = cartItems.map((item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${item.productName}</strong>
              <br><span style="color: #666; font-size: 12px;">Size: ${item.variantSize}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join("");

        // Send recovery email
        const emailResponse = await resend.emails.send({
          from: `${STORE_NAME} <onboarding@resend.dev>`,
          to: [userEmail],
          subject: `You left items in your cart at ${STORE_NAME}!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">${STORE_NAME}</h1>
                  <p style="color: #666; font-size: 14px; margin-top: 8px;">Your favorite Indian grocery store</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                  <h2 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">Don't forget your items!</h2>
                  <p style="color: #333; margin: 0; font-size: 16px;">Your cart is waiting for you</p>
                </div>

                <div style="margin-bottom: 30px;">
                  <h3 style="color: #1a1a1a; font-size: 18px; margin-bottom: 15px;">Your Cart Items</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f8f8f8;">
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${cartItemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" style="padding: 15px 12px; font-weight: 700; font-size: 16px;">Total</td>
                        <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #FF8C00;">₹${cart.cart_total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${siteUrl}/cart" style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Complete Your Order
                  </a>
                </div>

                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
                    🎁 Use code <strong style="color: #FF8C00;">COMEBACK10</strong> for 10% off your order!
                  </p>
                </div>

                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    If you have any questions, reply to this email or contact us at support@desipantry.com
                  </p>
                  <p style="color: #999; font-size: 12px; margin-top: 10px;">
                    © ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Recovery email sent to ${userEmail} for cart ${cart.id}:`, emailResponse);

        // Mark cart as recovery email sent
        const { error: updateError } = await supabase
          .from("cart_sessions")
          .update({ 
            recovery_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", cart.id);

        if (updateError) {
          console.error(`Error updating cart ${cart.id}:`, updateError);
        }

        results.sent++;
      } catch (emailError: any) {
        console.error(`Error sending email for cart ${cart.id}:`, emailError);
        results.errors.push(`Cart ${cart.id}: ${emailError.message}`);
      }
    }

    console.log("=== Auto Cart Recovery Cron Job Complete ===");
    console.log("Results:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-cart-recovery function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
