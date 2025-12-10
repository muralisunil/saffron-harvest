-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  
  -- Order totals
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Shipping info
  shipping_name TEXT,
  shipping_email TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_pincode TEXT,
  
  -- Tracking
  checkout_started_at TIMESTAMP WITH TIME ZONE,
  checkout_completed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart abandonment tracking table
CREATE TABLE public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  checkout_started BOOLEAN DEFAULT false,
  checkout_completed BOOLEAN DEFAULT false,
  abandoned BOOLEAN DEFAULT false,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view their order items"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create order items"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
  AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
));

-- Cart sessions policies
CREATE POLICY "Users can view their cart sessions"
ON public.cart_sessions FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create cart sessions"
ON public.cart_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their cart sessions"
ON public.cart_sessions FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create updated_at triggers
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at
BEFORE UPDATE ON public.cart_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_cart_sessions_session_id ON public.cart_sessions(session_id);
CREATE INDEX idx_cart_sessions_abandoned ON public.cart_sessions(abandoned);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;