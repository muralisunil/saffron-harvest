-- Add column to track second follow-up email
ALTER TABLE public.cart_sessions 
ADD COLUMN IF NOT EXISTS recovery_email_2_sent_at TIMESTAMP WITH TIME ZONE;