-- Create enum for experiment status
CREATE TYPE public.offer_experiment_status AS ENUM ('draft', 'running', 'paused', 'completed', 'archived');

-- Create offer experiments table
CREATE TABLE public.offer_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status offer_experiment_status NOT NULL DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  traffic_percent INTEGER NOT NULL DEFAULT 100 CHECK (traffic_percent >= 0 AND traffic_percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create experiment variants table
CREATE TABLE public.offer_experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.offer_experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  offer_ids UUID[] NOT NULL DEFAULT '{}',
  is_control BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user variant assignments table (stable assignment)
CREATE TABLE public.offer_experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.offer_experiments(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  variant_id UUID NOT NULL REFERENCES public.offer_experiment_variants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, user_id),
  UNIQUE (experiment_id, session_id)
);

-- Create exposure logging table
CREATE TABLE public.offer_experiment_exposures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.offer_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.offer_experiment_variants(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  offer_id UUID,
  context JSONB DEFAULT '{}',
  exposed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversion events table
CREATE TABLE public.offer_experiment_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.offer_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.offer_experiment_variants(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  conversion_type TEXT NOT NULL,
  conversion_value NUMERIC,
  order_id UUID,
  properties JSONB DEFAULT '{}',
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_experiment_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_experiment_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments (public read for active, authenticated write)
CREATE POLICY "Anyone can view active experiments"
ON public.offer_experiments FOR SELECT
USING (status IN ('running', 'completed'));

CREATE POLICY "Authenticated users can manage experiments"
ON public.offer_experiments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for variants (public read)
CREATE POLICY "Anyone can view variants"
ON public.offer_experiment_variants FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage variants"
ON public.offer_experiment_variants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for assignments (allow inserts and reads)
CREATE POLICY "Anyone can read assignments"
ON public.offer_experiment_assignments FOR SELECT
USING (true);

CREATE POLICY "Anyone can create assignments"
ON public.offer_experiment_assignments FOR INSERT
WITH CHECK (true);

-- RLS Policies for exposures (allow inserts and reads)
CREATE POLICY "Anyone can read exposures"
ON public.offer_experiment_exposures FOR SELECT
USING (true);

CREATE POLICY "Anyone can log exposures"
ON public.offer_experiment_exposures FOR INSERT
WITH CHECK (true);

-- RLS Policies for conversions (allow inserts and reads)
CREATE POLICY "Anyone can read conversions"
ON public.offer_experiment_conversions FOR SELECT
USING (true);

CREATE POLICY "Anyone can log conversions"
ON public.offer_experiment_conversions FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_experiment_variants_experiment ON public.offer_experiment_variants(experiment_id);
CREATE INDEX idx_experiment_assignments_experiment ON public.offer_experiment_assignments(experiment_id);
CREATE INDEX idx_experiment_assignments_user ON public.offer_experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_session ON public.offer_experiment_assignments(session_id);
CREATE INDEX idx_experiment_exposures_experiment ON public.offer_experiment_exposures(experiment_id);
CREATE INDEX idx_experiment_exposures_variant ON public.offer_experiment_exposures(variant_id);
CREATE INDEX idx_experiment_conversions_experiment ON public.offer_experiment_conversions(experiment_id);

-- Create trigger for updated_at
CREATE TRIGGER update_offer_experiments_updated_at
BEFORE UPDATE ON public.offer_experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();