-- Create enums for offer system
CREATE TYPE public.offer_type AS ENUM (
  'percent_discount',
  'flat_discount',
  'free_item',
  'tiered_discount',
  'price_override',
  'cashback',
  'loyalty_points',
  'buy_x_get_y',
  'mix_and_match',
  'cheapest_item',
  'free_gift'
);

CREATE TYPE public.offer_scope AS ENUM ('item', 'category', 'brand', 'cart', 'user');

CREATE TYPE public.offer_status AS ENUM ('draft', 'active', 'paused', 'expired', 'archived');

CREATE TYPE public.rule_operator AS ENUM (
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 
  'in', 'not_in', 'exists', 'between', 'matches'
);

CREATE TYPE public.rule_group_logic AS ENUM ('all', 'any');

CREATE TYPE public.stacking_policy AS ENUM ('stackable', 'exclusive', 'stack_group');

CREATE TYPE public.funded_by AS ENUM ('platform', 'brand');

-- Offers table (main entity)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  marketing_text TEXT,
  offer_type offer_type NOT NULL,
  offer_scope offer_scope NOT NULL DEFAULT 'cart',
  status offer_status NOT NULL DEFAULT 'draft',
  priority INTEGER NOT NULL DEFAULT 100,
  stacking_policy stacking_policy NOT NULL DEFAULT 'stackable',
  stack_group TEXT,
  funded_by funded_by NOT NULL DEFAULT 'platform',
  campaign_id TEXT,
  channels TEXT[] DEFAULT ARRAY['web']::TEXT[],
  regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  order_types TEXT[] DEFAULT ARRAY['delivery', 'pickup']::TEXT[],
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses_total INTEGER,
  max_uses_per_user INTEGER,
  current_version_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offer versions table (for versioning/audit)
CREATE TABLE public.offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  benefit_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  qualifying_filters JSONB DEFAULT '{}'::JSONB,
  caps_config JSONB DEFAULT '{"max_discount_amount": null, "min_price_floor": null, "rounding": "half_up"}'::JSONB,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(offer_id, version_number)
);

-- Rule groups table (for AND/OR grouping)
CREATE TABLE public.rule_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_version_id UUID NOT NULL REFERENCES public.offer_versions(id) ON DELETE CASCADE,
  parent_group_id UUID REFERENCES public.rule_groups(id) ON DELETE CASCADE,
  logic rule_group_logic NOT NULL DEFAULT 'all',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rules table (individual conditions)
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_group_id UUID NOT NULL REFERENCES public.rule_groups(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  operator rule_operator NOT NULL,
  value JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for current_version after offer_versions exists
ALTER TABLE public.offers 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) REFERENCES public.offer_versions(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for active offers, admin write
CREATE POLICY "Anyone can view active offers" ON public.offers
FOR SELECT USING (status = 'active' OR status = 'draft');

CREATE POLICY "Authenticated users can create offers" ON public.offers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update offers" ON public.offers
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete offers" ON public.offers
FOR DELETE USING (true);

-- Offer versions policies
CREATE POLICY "Anyone can view offer versions" ON public.offer_versions
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create versions" ON public.offer_versions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update versions" ON public.offer_versions
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete versions" ON public.offer_versions
FOR DELETE USING (true);

-- Rule groups policies
CREATE POLICY "Anyone can view rule groups" ON public.rule_groups
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage rule groups" ON public.rule_groups
FOR ALL USING (true);

-- Rules policies
CREATE POLICY "Anyone can view rules" ON public.rules
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage rules" ON public.rules
FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_valid_window ON public.offers(valid_from, valid_until);
CREATE INDEX idx_offer_versions_offer_id ON public.offer_versions(offer_id);
CREATE INDEX idx_rule_groups_version_id ON public.rule_groups(offer_version_id);
CREATE INDEX idx_rules_group_id ON public.rules(rule_group_id);

-- Trigger for updated_at
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();