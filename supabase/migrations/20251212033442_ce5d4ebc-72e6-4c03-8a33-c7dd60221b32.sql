-- Add column to track when recovery email was sent
ALTER TABLE public.cart_sessions 
ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;