import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EarnPointsRequest {
  action: 'earn';
  user_id: string;
  order_id: string;
  order_total: number;
}

interface RedeemPointsRequest {
  action: 'redeem';
  user_id: string;
  order_id: string;
  tier_id: string;
}

interface GetBalanceRequest {
  action: 'get_balance';
  user_id: string;
}

type RequestBody = EarnPointsRequest | RedeemPointsRequest | GetBalanceRequest;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();

    if (body.action === 'get_balance') {
      // Get user's current points balance
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', body.user_id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      // Get available redemption tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('loyalty_redemption_tiers')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (tiersError) throw tiersError;

      // Get recent transactions
      const { data: transactions, error: transError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', body.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transError) throw transError;

      return new Response(
        JSON.stringify({
          success: true,
          balance: pointsData?.points_balance || 0,
          lifetime_points: pointsData?.lifetime_points || 0,
          tiers: tiers || [],
          transactions: transactions || []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === 'earn') {
      const pointsToEarn = Math.floor(body.order_total);
      
      if (pointsToEarn <= 0) {
        return new Response(
          JSON.stringify({ success: true, points_earned: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already has a points record
      const { data: existing } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', body.user_id)
        .single();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_loyalty_points')
          .update({
            points_balance: existing.points_balance + pointsToEarn,
            lifetime_points: existing.lifetime_points + pointsToEarn
          })
          .eq('user_id', body.user_id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('user_loyalty_points')
          .insert({
            user_id: body.user_id,
            points_balance: pointsToEarn,
            lifetime_points: pointsToEarn
          });

        if (insertError) throw insertError;
      }

      // Log transaction
      const { error: transError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: body.user_id,
          transaction_type: 'earn',
          points: pointsToEarn,
          order_id: body.order_id,
          description: `Earned ${pointsToEarn} points from order`
        });

      if (transError) throw transError;

      console.log(`Awarded ${pointsToEarn} points to user ${body.user_id}`);

      return new Response(
        JSON.stringify({ success: true, points_earned: pointsToEarn }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === 'redeem') {
      // Get the tier
      const { data: tier, error: tierError } = await supabase
        .from('loyalty_redemption_tiers')
        .select('*')
        .eq('id', body.tier_id)
        .eq('is_active', true)
        .single();

      if (tierError || !tier) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid redemption tier' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's current balance
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', body.user_id)
        .single();

      if (pointsError || !pointsData) {
        return new Response(
          JSON.stringify({ success: false, error: 'No points balance found' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (pointsData.points_balance < tier.points_required) {
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient points' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct points
      const { error: updateError } = await supabase
        .from('user_loyalty_points')
        .update({
          points_balance: pointsData.points_balance - tier.points_required
        })
        .eq('user_id', body.user_id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: body.user_id,
          transaction_type: 'redeem',
          points: -tier.points_required,
          order_id: body.order_id,
          description: `Redeemed ${tier.points_required} points for $${tier.discount_amount} off`
        });

      if (transError) throw transError;

      console.log(`Redeemed ${tier.points_required} points for user ${body.user_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          points_redeemed: tier.points_required,
          discount_amount: tier.discount_amount,
          new_balance: pointsData.points_balance - tier.points_required
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error managing loyalty points:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
