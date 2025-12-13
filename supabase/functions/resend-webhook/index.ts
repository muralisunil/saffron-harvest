import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    click?: {
      link: string;
    };
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ResendWebhookPayload = await req.json();
    console.log("Received Resend webhook:", JSON.stringify(payload, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Map Resend event types to our tracking
    const eventType = payload.type; // email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained

    // Extract cart session ID from email metadata if available
    let cartSessionId = null;
    
    // Try to find the cart session by looking at recent recovery emails
    if (payload.data.to && payload.data.to.length > 0) {
      const recipientEmail = payload.data.to[0];
      
      // Look for orders with this email that have associated cart sessions
      const { data: orderData } = await supabase
        .from('orders')
        .select('id')
        .eq('shipping_email', recipientEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (orderData && orderData.length > 0) {
        // Try to find associated cart session
        const { data: cartData } = await supabase
          .from('cart_sessions')
          .select('id')
          .eq('recovery_email_sent_at', payload.created_at)
          .limit(1);
        
        if (cartData && cartData.length > 0) {
          cartSessionId = cartData[0].id;
        }
      }
    }

    // Insert tracking event
    const { error: insertError } = await supabase
      .from('email_tracking_events')
      .insert({
        email_id: payload.data.email_id,
        event_type: eventType,
        recipient_email: payload.data.to?.[0] || null,
        cart_session_id: cartSessionId,
        properties: {
          subject: payload.data.subject,
          from: payload.data.from,
          click_link: payload.data.click?.link || null,
          raw_type: payload.type,
          created_at: payload.created_at,
        },
      });

    if (insertError) {
      console.error("Error inserting tracking event:", insertError);
      throw insertError;
    }

    console.log(`Successfully tracked ${eventType} event for email ${payload.data.email_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
