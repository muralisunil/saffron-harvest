import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundEmailRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  refundType: "full" | "partial_amount" | "item_cancellation";
  refundAmount: number;
  reason?: string;
  cancelledItems?: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    refundAmount: number;
  }>;
  isFullyCancelled: boolean;
  remainingTotal: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      customerEmail,
      customerName,
      orderNumber,
      refundType,
      refundAmount,
      reason,
      cancelledItems,
      isFullyCancelled,
      remainingTotal,
    }: RefundEmailRequest = await req.json();

    console.log("[SEND-REFUND-EMAIL] Sending email to:", customerEmail);

    const subject = isFullyCancelled
      ? `Order ${orderNumber} - Cancellation & Refund Confirmed`
      : `Order ${orderNumber} - Partial Refund Processed`;

    const itemsHtml = cancelledItems && cancelledItems.length > 0
      ? `
        <h3 style="color: #333; margin-top: 24px;">Cancelled Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="text-align: left; padding: 12px; border-bottom: 1px solid #ddd;">Item</th>
              <th style="text-align: center; padding: 12px; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">Refund</th>
            </tr>
          </thead>
          <tbody>
            ${cancelledItems.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  ${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}
                </td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">$${item.refundAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    const refundTypeText = refundType === 'full' 
      ? 'Full order cancellation' 
      : refundType === 'item_cancellation' 
        ? 'Item cancellation' 
        : 'Partial refund';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              ${isFullyCancelled ? '🔄 Order Cancelled' : '💰 Refund Processed'}
            </h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 24px;">
              Hi ${customerName || 'Valued Customer'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              ${isFullyCancelled 
                ? `Your order <strong>${orderNumber}</strong> has been cancelled and a full refund has been processed.`
                : `A refund has been processed for your order <strong>${orderNumber}</strong>.`
              }
            </p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #333;">Refund Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Refund Type:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${refundTypeText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Refund Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 20px; color: #22c55e;">$${refundAmount.toFixed(2)}</td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Reason:</td>
                  <td style="padding: 8px 0; text-align: right;">${reason}</td>
                </tr>
                ` : ''}
                ${!isFullyCancelled ? `
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 12px 0 8px; color: #666;">Remaining Order Total:</td>
                  <td style="padding: 12px 0 8px; text-align: right; font-weight: 500;">$${remainingTotal.toFixed(2)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${itemsHtml}
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏱️ Processing Time:</strong> Your refund will be credited to your original payment method within 5-10 business days, depending on your bank or payment provider.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              If you have any questions about this refund, please don't hesitate to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated message regarding your order ${orderNumber}.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Orders <onboarding@resend.dev>",
      to: [customerEmail],
      subject,
      html,
    });

    console.log("[SEND-REFUND-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SEND-REFUND-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
