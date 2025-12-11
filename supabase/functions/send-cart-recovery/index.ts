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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cartSessionId, email, storeName = "Desi Pantry" } = await req.json();

    console.log("Processing cart recovery request:", { cartSessionId, email });

    if (!email) {
      throw new Error("Email is required");
    }

    // Fetch cart session data
    let cartSession: CartSession | null = null;
    
    if (cartSessionId) {
      const { data, error } = await supabase
        .from("cart_sessions")
        .select("*")
        .eq("id", cartSessionId)
        .single();
      
      if (error) {
        console.error("Error fetching cart session:", error);
        throw new Error("Failed to fetch cart session");
      }
      cartSession = data;
    }

    // Generate cart items HTML
    const cartItemsHtml = cartSession?.cart_items
      ? (cartSession.cart_items as CartItem[]).map((item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong>
            <br><span style="color: #666; font-size: 12px;">Size: ${item.variantSize}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join("")
      : "";

    const cartTotal = cartSession?.cart_total || 0;
    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.lovable.app";

    // Send recovery email
    const emailResponse = await resend.emails.send({
      from: `${storeName} <onboarding@resend.dev>`,
      to: [email],
      subject: `You left items in your cart at ${storeName}!`,
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
              <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">${storeName}</h1>
              <p style="color: #666; font-size: 14px; margin-top: 8px;">Your favorite Indian grocery store</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #FF8C00 0%, #FFD700 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
              <h2 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">Don't forget your items!</h2>
              <p style="color: #333; margin: 0; font-size: 16px;">Your cart is waiting for you</p>
            </div>

            ${cartItemsHtml ? `
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
                    <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #FF8C00;">₹${cartTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ` : ""}

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
                © ${new Date().getFullYear()} ${storeName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Recovery email sent successfully:", emailResponse);

    // Mark cart as recovery email sent
    if (cartSessionId) {
      await supabase
        .from("cart_sessions")
        .update({ 
          recovered: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", cartSessionId);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-cart-recovery function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
