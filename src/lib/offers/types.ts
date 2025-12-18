// Offer system types matching database schema

export type OfferType = 
  | 'percent_discount'
  | 'flat_discount'
  | 'free_item'
  | 'tiered_discount'
  | 'price_override'
  | 'cashback'
  | 'loyalty_points'
  | 'buy_x_get_y'
  | 'mix_and_match'
  | 'cheapest_item'
  | 'free_gift';

export type OfferScope = 'item' | 'category' | 'brand' | 'cart' | 'user';

export type OfferStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';

export type RuleOperator = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'in' | 'not_in' | 'exists' | 'between' | 'matches';

export type RuleGroupLogic = 'all' | 'any';

export type StackingPolicy = 'stackable' | 'exclusive' | 'stack_group';

export type FundedBy = 'platform' | 'brand';

// Cart model for evaluation
export interface CartLineItem {
  id: string;
  line_id: string; // Alias for id, used in adjustments
  sku: string;
  product_id: string;
  variant_id?: string;
  name: string;
  unit_price: number;
  quantity: number;
  extended_price: number;
  line_total: number; // Alias for extended_price
  category?: string;
  brand?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
  days_to_expiry?: number;
  temperature_zone?: 'frozen' | 'chilled' | 'ambient';
}

export interface Cart {
  id: string;
  items: CartLineItem[];
  line_items: CartLineItem[]; // Alias for items
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  taxes: number;
  grand_total: number;
  is_subscription?: boolean;
  order_type?: 'delivery' | 'pickup' | 'subscription';
}

export interface User {
  id: string;
  email?: string;
  tags?: string[];
  segments?: string[];
  lifecycle_stage?: 'new' | 'active' | 'at_risk' | 'churned';
  order_count?: number;
  order_streak_weeks?: number;
  total_spend?: number;
  first_order_date?: string;
  last_order_date?: string;
}

export interface EvaluationContext {
  current_time: Date;
  channel: 'web' | 'ios' | 'android';
  region?: string;
  store_id?: string;
  delivery_zone?: string;
  inventory_levels?: Record<string, number>;
}

// Rule structures
export interface Rule {
  id: string;
  field_path: string;
  operator: RuleOperator;
  value: unknown;
  sort_order: number;
}

export interface RuleGroup {
  id: string;
  logic: RuleGroupLogic;
  rules: Rule[];
  nested_groups: RuleGroup[];
  sort_order: number;
}

// Offer structures
export interface OfferVersion {
  id: string;
  offer_id: string;
  version_number: number;
  benefit_config: BenefitConfig;
  qualifying_filters: QualifyingFilters;
  caps_config: CapsConfig;
  rule_groups: RuleGroup[];
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  marketing_text?: string;
  offer_type: OfferType;
  offer_scope: OfferScope;
  status: OfferStatus;
  priority: number;
  stacking_policy: StackingPolicy;
  stack_group?: string;
  funded_by: FundedBy;
  campaign_id?: string;
  channels: string[];
  regions: string[];
  order_types: string[];
  valid_from?: string;
  valid_until?: string;
  max_uses_total?: number;
  max_uses_per_user?: number;
  current_version?: OfferVersion;
}

export interface BenefitConfig {
  discount_percent?: number;
  discount_amount?: number;
  free_sku?: string;
  // Buy X Get Y
  buy_qty?: number;
  get_qty?: number;
  buy_quantity?: number; // Alias
  get_quantity?: number; // Alias
  get_discount_percent?: number;
  max_sets?: number;
  selection_strategy?: 'lowest_priced' | 'highest_priced' | 'fifo';
  // Tiered discount
  tiers?: Array<{ min_qty: number; max_qty?: number; discount: number; discount_percent?: number; discount_amount?: number; price_per_unit?: number }>;
  apply_per_item?: boolean;
  // Mix and match
  groups?: Array<{ group_id: string; filters: QualifyingFilters; required_quantity: number }>;
  combo_price?: number;
  combo_discount_percent?: number;
  combo_discount_amount?: number;
  max_combos?: number;
  // Cheapest item
  min_qualifying_items?: number;
  max_items?: number;
  // Free gift
  gift_items?: Array<{ product_id: string; variant_id?: string; quantity: number; max_per_order?: number }>;
  min_qualifying_qty?: number;
  // Cashback
  cashback_percent?: number;
  cashback_amount?: number;
  max_cashback?: number;
  credit_timing?: 'immediate' | 'after_delivery' | 'after_return_window';
  // Loyalty points
  points_per_dollar?: number;
  bonus_points?: number;
  points_multiplier?: number;
  max_points?: number;
  // Shared
  min_cart_value?: number;
  apply_to_qualifying_only?: boolean;
  // General
  apply_to?: 'lowest_priced' | 'highest_priced' | 'nth_item';
  group_size?: number;
  threshold_amount?: number;
}

export interface QualifyingFilters {
  skus?: string[];
  categories?: string[];
  brands?: string[];
  tags?: string[];
  temperature_zones?: string[];
  exclude_skus?: string[];
  exclude_categories?: string[];
}

export interface CapsConfig {
  max_discount_amount?: number;
  min_price_floor?: number;
  rounding: 'half_up' | 'floor' | 'ceil';
  apply_pre_tax: boolean;
  apply_to_fees: boolean;
}

// Evaluation results
export interface LineItemAdjustment {
  line_id: string;
  offer_id: string;
  amount: number;
  display_text: string;
  metadata?: Record<string, unknown>;
}

export interface ApplicationPlan {
  offer_id: string;
  offer_name: string;
  scope: OfferScope;
  total_discount: number;
  line_adjustments: LineItemAdjustment[];
  affected_line_ids: string[];
  funded_by: FundedBy;
  campaign_id?: string;
  display_text: string;
}

export interface EvaluationResult {
  applicable_offers: Offer[];
  plans: ApplicationPlan[];
  messages: string[];
  potential_offers: Array<{ offer: Offer; missing_conditions: string[] }>;
}

// Derived fields for rule evaluation
export interface DerivedFields {
  eligible_item_count: number;
  category_totals: Record<string, number>;
  brand_totals: Record<string, number>;
  tag_totals: Record<string, number>;
  total_quantity: number;
  distinct_sku_count: number;
  qualifying_items: CartLineItem[];
}
