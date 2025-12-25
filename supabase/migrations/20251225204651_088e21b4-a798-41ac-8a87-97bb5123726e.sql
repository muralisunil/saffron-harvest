-- Add refund tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;

-- Create order_refunds table for tracking multiple partial refunds
CREATE TABLE public.order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_refund_id text,
  amount numeric NOT NULL,
  reason text,
  refund_type text NOT NULL CHECK (refund_type IN ('full', 'partial_amount', 'item_cancellation')),
  refunded_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Add cancelled_quantity to order_items for item-level cancellations
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS cancelled_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_amount numeric DEFAULT 0;

-- Enable RLS
ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_refunds
CREATE POLICY "Admins can manage refunds"
ON public.order_refunds
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their order refunds"
ON public.order_refunds
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_refunds.order_id 
  AND orders.user_id = auth.uid()
));