import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    // For non-webhook requests, process order completion
    if (!signature) {
      const { session_id } = JSON.parse(body);
      
      if (!session_id) {
        return new Response(
          JSON.stringify({ error: "Missing session_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status !== "paid") {
        return new Response(
          JSON.stringify({ error: "Payment not completed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const metadata = session.metadata || {};
      const userId = metadata.userId;
      const cartSubtotal = parseFloat(metadata.cartSubtotal || "0");
      const rewardRedemption = metadata.rewardRedemption ? JSON.parse(metadata.rewardRedemption) : null;

      // Award points for this purchase (1 point per dollar)
      if (userId && cartSubtotal > 0) {
        const pointsToEarn = Math.floor(cartSubtotal);

        // Get or create user points record
        const { data: existing } = await supabase
          .from('user_loyalty_points')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existing) {
          await supabase
            .from('user_loyalty_points')
            .update({
              points_balance: existing.points_balance + pointsToEarn,
              lifetime_points: existing.lifetime_points + pointsToEarn
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_loyalty_points')
            .insert({
              user_id: userId,
              points_balance: pointsToEarn,
              lifetime_points: pointsToEarn
            });
        }

        // Log earn transaction
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'earn',
            points: pointsToEarn,
            description: `Earned ${pointsToEarn} points from order`
          });

        console.log(`Awarded ${pointsToEarn} points to user ${userId}`);

        // If rewards were redeemed, log the redemption
        if (rewardRedemption && rewardRedemption.tier_id) {
          await supabase
            .from('loyalty_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'redeem',
              points: -rewardRedemption.points_required,
              description: `Redeemed ${rewardRedemption.points_required} points for $${rewardRedemption.discount_amount} off`
            });

          // Deduct redeemed points
          const { data: currentPoints } = await supabase
            .from('user_loyalty_points')
            .select('points_balance')
            .eq('user_id', userId)
            .single();

          if (currentPoints) {
            await supabase
              .from('user_loyalty_points')
              .update({
                points_balance: currentPoints.points_balance - rewardRedemption.points_required
              })
              .eq('user_id', userId);
          }

          console.log(`Redeemed ${rewardRedemption.points_required} points for user ${userId}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          points_earned: userId ? Math.floor(cartSubtotal) : 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing order completion:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
