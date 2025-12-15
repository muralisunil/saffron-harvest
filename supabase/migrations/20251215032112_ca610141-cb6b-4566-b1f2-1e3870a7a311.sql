-- Create enum for A/B test status
CREATE TYPE public.ab_test_status AS ENUM ('active', 'paused', 'completed');

-- Create A/B tests table
CREATE TABLE public.email_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'first_recovery',
  status ab_test_status NOT NULL DEFAULT 'active',
  winning_variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create variants table
CREATE TABLE public.email_ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.email_ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  discount_code TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 50,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add variant tracking to cart_sessions
ALTER TABLE public.cart_sessions 
ADD COLUMN ab_variant_id UUID REFERENCES public.email_ab_test_variants(id);

-- Enable RLS
ALTER TABLE public.email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ab_test_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for tests
CREATE POLICY "Allow public read of ab tests" 
ON public.email_ab_tests FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated update of ab tests" 
ON public.email_ab_tests FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated insert of ab tests" 
ON public.email_ab_tests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete of ab tests" 
ON public.email_ab_tests FOR DELETE 
USING (true);

-- RLS policies for variants
CREATE POLICY "Allow public read of variants" 
ON public.email_ab_test_variants FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated update of variants" 
ON public.email_ab_test_variants FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated insert of variants" 
ON public.email_ab_test_variants FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete of variants" 
ON public.email_ab_test_variants FOR DELETE 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_email_ab_tests_updated_at
BEFORE UPDATE ON public.email_ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();