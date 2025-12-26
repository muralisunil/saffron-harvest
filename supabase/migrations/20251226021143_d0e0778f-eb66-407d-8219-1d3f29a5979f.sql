-- Create user loyalty points table
CREATE TABLE public.user_loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty transactions table for history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem', 'expire', 'adjust'
  points INTEGER NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty redemption tiers table
CREATE TABLE public.loyalty_redemption_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  points_required INTEGER NOT NULL,
  discount_amount NUMERIC NOT NULL,
  min_purchase_amount NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemption_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_loyalty_points
CREATE POLICY "Users can view their own points"
  ON public.user_loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage points"
  ON public.user_loyalty_points FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (true);

-- RLS policies for redemption tiers (public read)
CREATE POLICY "Anyone can view active tiers"
  ON public.loyalty_redemption_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
  ON public.loyalty_redemption_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default redemption tiers
INSERT INTO public.loyalty_redemption_tiers (points_required, discount_amount, min_purchase_amount) VALUES
  (100, 5, 5),
  (200, 12, 12),
  (300, 18, 18),
  (400, 25, 25);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_loyalty_points_updated_at
  BEFORE UPDATE ON public.user_loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();