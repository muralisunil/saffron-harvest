-- Create recovery email settings table
CREATE TABLE public.recovery_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abandonment_threshold_minutes integer NOT NULL DEFAULT 60,
  first_email_discount_code text NOT NULL DEFAULT 'COMEBACK10',
  first_email_discount_percent integer NOT NULL DEFAULT 10,
  second_email_delay_hours integer NOT NULL DEFAULT 24,
  second_email_discount_code text NOT NULL DEFAULT 'COMEBACK20',
  second_email_discount_percent integer NOT NULL DEFAULT 20,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recovery_email_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for edge function)
CREATE POLICY "Allow public read of settings"
ON public.recovery_email_settings
FOR SELECT
USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated update of settings"
ON public.recovery_email_settings
FOR UPDATE
TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.recovery_email_settings (
  abandonment_threshold_minutes,
  first_email_discount_code,
  first_email_discount_percent,
  second_email_delay_hours,
  second_email_discount_code,
  second_email_discount_percent
) VALUES (60, 'COMEBACK10', 10, 24, 'COMEBACK20', 20);

-- Add update trigger
CREATE TRIGGER update_recovery_email_settings_updated_at
BEFORE UPDATE ON public.recovery_email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();