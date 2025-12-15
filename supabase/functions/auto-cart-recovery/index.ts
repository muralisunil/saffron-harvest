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
  recovery_email_2_sent_at: string | null;
  ab_variant_id: string | null;
}

interface RecoverySettings {
  abandonment_threshold_minutes: number;
  first_email_discount_code: string;
  first_email_discount_percent: number;
  second_email_delay_hours: number;
  second_email_discount_code: string;
  second_email_discount_percent: number;
  enabled: boolean;
}

interface ABTestVariant {
  id: string;
  test_id: string;
  name: string;
  subject_line: string;
  discount_percent: number;
  discount_code: string;
  weight: number;
  emails_sent: number;
}

interface ABTest {
  id: string;
  name: string;
  email_type: string;
  status: string;
  winning_variant_id: string | null;
}

// Helper function to select variant by weight
function selectVariantByWeight(variants: ABTestVariant[]): ABTestVariant | null {
  if (variants.length === 0) return null;
  
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return variants[0];
  
  const random = Math.random() * totalWeight;
  let cumulative = 0;
  
  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

const STORE_NAME = "Desi Pantry";

// Default settings fallback
const DEFAULT_SETTINGS: RecoverySettings = {
  abandonment_threshold_minutes: 60,
  first_email_discount_code: "COMEBACK10",
  first_email_discount_percent: 10,
  second_email_delay_hours: 24,
  second_email_discount_code: "COMEBACK20",
  second_email_discount_percent: 20,
  enabled: true,
};

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

    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.lovable.app";

    // Fetch configurable settings from database
    const { data: settingsData } = await supabase
      .from("recovery_email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const settings: RecoverySettings = settingsData || DEFAULT_SETTINGS;
    console.log("Using settings:", settings);

    // Check if recovery emails are enabled
    if (!settings.enabled) {
      console.log("Recovery emails are disabled. Exiting.");
      return new Response(
        JSON.stringify({ success: true, message: "Recovery emails are disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = {
      processed: 0,
      firstEmailsSent: 0,
      secondEmailsSent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Fetch active A/B tests
    const { data: abTests } = await supabase
      .from("email_ab_tests")
      .select("*")
      .in("status", ["active", "completed"]);

    const activeFirstTest = (abTests || []).find((t: ABTest) => t.email_type === "first_recovery" && (t.status === "active" || t.status === "completed"));
    const activeSecondTest = (abTests || []).find((t: ABTest) => t.email_type === "second_recovery" && (t.status === "active" || t.status === "completed"));

    // Fetch variants for active tests
    let firstTestVariants: ABTestVariant[] = [];
    let secondTestVariants: ABTestVariant[] = [];

    if (activeFirstTest) {
      const { data } = await supabase
        .from("email_ab_test_variants")
        .select("*")
        .eq("test_id", activeFirstTest.id);
      firstTestVariants = data || [];
    }

    if (activeSecondTest) {
      const { data } = await supabase
        .from("email_ab_test_variants")
        .select("*")
        .eq("test_id", activeSecondTest.id);
      secondTestVariants = data || [];
    }

    // ========== FIRST EMAIL: After abandonment threshold ==========
    const firstThresholdTime = new Date();
    firstThresholdTime.setMinutes(firstThresholdTime.getMinutes() - settings.abandonment_threshold_minutes);

    console.log("Looking for carts for FIRST email (abandoned before):", firstThresholdTime.toISOString());

    const { data: firstEmailCarts, error: firstFetchError } = await supabase
      .from("cart_sessions")
      .select("*")
      .eq("abandoned", true)
      .eq("checkout_completed", false)
      .is("recovery_email_sent_at", null)
      .lt("abandoned_at", firstThresholdTime.toISOString())
      .gt("cart_total", 0)
      .limit(50);

    if (firstFetchError) {
      console.error("Error fetching carts for first email:", firstFetchError);
    } else {
      console.log(`Found ${firstEmailCarts?.length || 0} carts for first email`);

      for (const cart of (firstEmailCarts || []) as CartSession[]) {
        results.processed++;
        const userEmail = await getUserEmail(supabase, cart.user_id);

        if (!userEmail) {
          console.log(`Skipping cart ${cart.id}: No email found`);
          results.skipped++;
          continue;
        }

        // Select A/B test variant if available
        let discountCode = settings.first_email_discount_code;
        let discountPercent = settings.first_email_discount_percent;
        let subjectLine: string | undefined;
        let selectedVariantId: string | null = null;

        if (activeFirstTest && firstTestVariants.length > 0) {
          const variant = activeFirstTest.winning_variant_id
            ? firstTestVariants.find((v: ABTestVariant) => v.id === activeFirstTest.winning_variant_id)
            : selectVariantByWeight(firstTestVariants);
          
          if (variant) {
            discountCode = variant.discount_code;
            discountPercent = variant.discount_percent;
            subjectLine = variant.subject_line;
            selectedVariantId = variant.id;
            console.log(`Using A/B variant: ${variant.name} for cart ${cart.id}`);
          }
        }

        try {
          await sendRecoveryEmail(resend, {
            cart,
            userEmail,
            siteUrl,
            isSecondEmail: false,
            discountCode,
            discountPercent,
            subjectLine,
          });

          await supabase
            .from("cart_sessions")
            .update({
              recovery_email_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ab_variant_id: selectedVariantId,
            })
            .eq("id", cart.id);

          // Increment variant emails_sent counter
          if (selectedVariantId) {
            const currentVariant = firstTestVariants.find((v: ABTestVariant) => v.id === selectedVariantId);
            if (currentVariant) {
              await supabase
                .from("email_ab_test_variants")
                .update({ emails_sent: currentVariant.emails_sent + 1 })
                .eq("id", selectedVariantId);
            }
          }

          results.firstEmailsSent++;
          console.log(`First recovery email sent to ${userEmail} for cart ${cart.id}`);
        } catch (emailError: any) {
          console.error(`Error sending first email for cart ${cart.id}:`, emailError);
          results.errors.push(`Cart ${cart.id} (1st): ${emailError.message}`);
        }
      }
    }

    // ========== SECOND EMAIL: After configured delay ==========
    const secondThresholdTime = new Date();
    secondThresholdTime.setHours(secondThresholdTime.getHours() - settings.second_email_delay_hours);

    console.log("Looking for carts for SECOND email (first sent before):", secondThresholdTime.toISOString());

    const { data: secondEmailCarts, error: secondFetchError } = await supabase
      .from("cart_sessions")
      .select("*")
      .eq("abandoned", true)
      .eq("checkout_completed", false)
      .eq("recovered", false)
      .not("recovery_email_sent_at", "is", null)
      .is("recovery_email_2_sent_at", null)
      .lt("recovery_email_sent_at", secondThresholdTime.toISOString())
      .gt("cart_total", 0)
      .limit(50);

    if (secondFetchError) {
      console.error("Error fetching carts for second email:", secondFetchError);
    } else {
      console.log(`Found ${secondEmailCarts?.length || 0} carts for second email`);

      for (const cart of (secondEmailCarts || []) as CartSession[]) {
        results.processed++;
        const userEmail = await getUserEmail(supabase, cart.user_id);

        if (!userEmail) {
          console.log(`Skipping cart ${cart.id}: No email found`);
          results.skipped++;
          continue;
        }

        try {
          await sendRecoveryEmail(resend, {
            cart,
            userEmail,
            siteUrl,
            isSecondEmail: true,
            discountCode: settings.second_email_discount_code,
            discountPercent: settings.second_email_discount_percent,
          });

          await supabase
            .from("cart_sessions")
            .update({
              recovery_email_2_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", cart.id);

          results.secondEmailsSent++;
          console.log(`Second recovery email sent to ${userEmail} for cart ${cart.id}`);
        } catch (emailError: any) {
          console.error(`Error sending second email for cart ${cart.id}:`, emailError);
          results.errors.push(`Cart ${cart.id} (2nd): ${emailError.message}`);
        }
      }
    }

    console.log("=== Auto Cart Recovery Cron Job Complete ===");
    console.log("Results:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
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

// Helper function to get user email
async function getUserEmail(supabase: any, userId: string | null): Promise<string | null> {
  if (!userId) return null;

  const { data: recentOrder } = await supabase
    .from("orders")
    .select("shipping_email")
    .eq("user_id", userId)
    .not("shipping_email", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return recentOrder?.shipping_email || null;
}

// Helper function to send recovery email
async function sendRecoveryEmail(
  resend: Resend,
  options: {
    cart: CartSession;
    userEmail: string;
    siteUrl: string;
    isSecondEmail: boolean;
    discountCode: string;
    discountPercent: number;
    subjectLine?: string;
  }
) {
  const { cart, userEmail, siteUrl, isSecondEmail, discountCode, discountPercent, subjectLine } = options;
  const cartItems = cart.cart_items as CartItem[];

  // Different messaging for first vs second email
  const discountPercentStr = `${discountPercent}%`;
  const defaultSubject = isSecondEmail
    ? `⏰ Last chance! Your cart expires soon - Get ${discountPercentStr} OFF!`
    : `You left items in your cart at ${STORE_NAME}!`;
  const subject = subjectLine || defaultSubject;
  const headerText = isSecondEmail
    ? "Last chance to save!"
    : "Don't forget your items!";
  const subHeaderText = isSecondEmail
    ? `We're giving you an EXTRA ${discountPercentStr} OFF to complete your order`
    : "Your cart is waiting for you";

  const cartItemsHtml = cartItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.productName}</strong>
          <br><span style="color: #666; font-size: 12px;">Size: ${item.variantSize}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const urgencyBanner = isSecondEmail
    ? `
      <div style="background-color: #FF4444; color: white; padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
        <strong>⚡ LIMITED TIME: Extra ${discountPercentStr} OFF expires in 24 hours!</strong>
      </div>
    `
    : "";

  await resend.emails.send({
    from: `${STORE_NAME} <onboarding@resend.dev>`,
    to: [userEmail],
    subject,
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
          
          ${urgencyBanner}
          
          <div style="background: linear-gradient(135deg, ${isSecondEmail ? "#FF4444" : "#FF8C00"} 0%, ${isSecondEmail ? "#FF8C00" : "#FFD700"} 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px;">${headerText}</h2>
            <p style="color: #ffffff; margin: 0; font-size: 16px;">${subHeaderText}</p>
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
            <a href="${siteUrl}/cart" style="display: inline-block; background: linear-gradient(135deg, ${isSecondEmail ? "#FF4444" : "#FF8C00"} 0%, ${isSecondEmail ? "#FF8C00" : "#FFD700"} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Order Now
            </a>
          </div>

          <div style="background-color: ${isSecondEmail ? "#FFF3CD" : "#f8f8f8"}; padding: 20px; border-radius: 8px; margin-bottom: 30px; ${isSecondEmail ? "border: 2px dashed #FF8C00;" : ""}">
            <p style="color: ${isSecondEmail ? "#856404" : "#666"}; font-size: ${isSecondEmail ? "16px" : "14px"}; margin: 0; text-align: center; font-weight: ${isSecondEmail ? "600" : "normal"};">
              🎁 Use code <strong style="color: #FF8C00; font-size: 18px;">${discountCode}</strong> for ${discountPercentStr} off your order!
              ${isSecondEmail ? "<br><span style='font-size: 12px; color: #666;'>This is our best offer - don't miss out!</span>" : ""}
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
}
