-- Create email tracking events table
CREATE TABLE public.email_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient_email TEXT,
  cart_session_id UUID REFERENCES public.cart_sessions(id),
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for webhook)
CREATE POLICY "Allow webhook inserts"
ON public.email_tracking_events
FOR INSERT
WITH CHECK (true);

-- Allow anonymous reads for analytics
CREATE POLICY "Allow analytics reads"
ON public.email_tracking_events
FOR SELECT
USING (true);

-- Create index for efficient querying
CREATE INDEX idx_email_tracking_event_type ON public.email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_created_at ON public.email_tracking_events(created_at);