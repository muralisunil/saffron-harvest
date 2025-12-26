import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Creating checkout session...");
    
    // Get cart items, customer info, and reward redemption from request
    const { cartItems, customerInfo, rewardRedemption } = await req.json();
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    console.log(`Processing ${cartItems.length} cart items`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user is authenticated (optional for guest checkout)
    let userEmail = customerInfo?.email;
    let customerId;
    let userId: string | null = null;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      const user = data.user;
      
      if (user) {
        userId = user.id;
        if (user.email) {
          userEmail = user.email;
          console.log(`Authenticated user: ${userEmail}`);
          
          // Check if customer exists in Stripe
          const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            console.log(`Found existing Stripe customer: ${customerId}`);
          }
        }
      }
    }

    // Calculate subtotal
    const cartSubtotal = cartItems.reduce((sum: number, item: any) => 
      sum + (item.variant.price * item.quantity), 0
    );

    // Create line items from cart
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.product.name} - ${item.variant.size}`,
          description: `${item.product.brand} | ${item.product.category}`,
          images: item.product.image ? [item.product.image] : [],
        },
        unit_amount: Math.round(item.variant.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
          description: "Standard shipping",
        },
        unit_amount: 500, // $5.00 shipping
      },
      quantity: 1,
    });

    // Create discounts array for Stripe
    const discounts: any[] = [];
    
    // Handle reward redemption discount
    if (rewardRedemption && rewardRedemption.discount_amount > 0 && userId) {
      // Create a coupon for the reward discount
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(rewardRedemption.discount_amount * 100),
        currency: 'usd',
        name: `Rewards Redemption - ${rewardRedemption.points_required} points`,
        duration: 'once',
      });
      
      discounts.push({ coupon: coupon.id });
      console.log(`Applied reward discount: $${rewardRedemption.discount_amount}`);
    }

    console.log("Creating Stripe checkout session...");

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${req.headers.get("origin")}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout`,
      metadata: {
        customerInfo: JSON.stringify(customerInfo),
        userId: userId || '',
        rewardRedemption: rewardRedemption ? JSON.stringify(rewardRedemption) : '',
        cartSubtotal: cartSubtotal.toString(),
      },
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating checkout session:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
