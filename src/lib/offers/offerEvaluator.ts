// Main offer evaluator - orchestrates eligibility checking and benefit computation
import { supabase } from '@/integrations/supabase/client';
import { 
  Offer, 
  Cart, 
  User, 
  EvaluationContext, 
  ApplicationPlan,
  EvaluationResult,
  CartLineItem,
  OfferVersion,
  RuleGroup,
  Rule
} from './types';
import { evaluateOfferEligibility } from './ruleEngine';
import { computeDerivedFields, filterQualifyingItems } from './derivedFields';
import { createStrategy, StrategyContext } from './strategies';

// Convert cart items from app format to offer system format
export function convertCartToOfferCart(
  items: Array<{
    product: { id: string; name: string; brand: string; category: string };
    variant: { id: string; price: number; size: string };
    quantity: number;
  }>
): Cart {
  const lineItems: CartLineItem[] = items.map((item, index) => {
    const lineId = `line_${index}`;
    const extendedPrice = item.variant.price * item.quantity;
    return {
      id: lineId,
      line_id: lineId,
      sku: item.variant.id,
      product_id: item.product.id,
      variant_id: item.variant.id,
      name: item.product.name,
      unit_price: item.variant.price,
      quantity: item.quantity,
      extended_price: extendedPrice,
      line_total: extendedPrice,
      category: item.product.category,
      brand: item.product.brand,
      tags: [],
      attributes: { size: item.variant.size }
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.extended_price, 0);

  return {
    id: `cart_${Date.now()}`,
    items: lineItems,
    line_items: lineItems,
    subtotal,
    delivery_fee: 0,
    service_fee: 0,
    taxes: 0,
    grand_total: subtotal
  };
}

// Fetch active offers from database
export async function fetchActiveOffers(): Promise<Offer[]> {
  const now = new Date().toISOString();
  
  const { data: offersData, error: offersError } = await supabase
    .from('offers')
    .select(`
      *,
      current_version:offer_versions!fk_current_version(
        *,
        rule_groups:rule_groups(
          *,
          rules:rules(*)
        )
      )
    `)
    .eq('status', 'active')
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('priority', { ascending: true });

  if (offersError) {
    console.error('Error fetching offers:', offersError);
    return [];
  }

  // Transform database format to internal format
  return (offersData || []).map(transformDbOffer);
}

// Transform database offer to internal format
function transformDbOffer(dbOffer: any): Offer {
  const currentVersion = dbOffer.current_version?.[0] || dbOffer.current_version;
  
  let offerVersion: OfferVersion | undefined;
  
  if (currentVersion) {
    // Transform rule groups with nested rules
    const ruleGroups: RuleGroup[] = (currentVersion.rule_groups || []).map((rg: any) => ({
      id: rg.id,
      logic: rg.logic,
      rules: (rg.rules || []).map((r: any): Rule => ({
        id: r.id,
        field_path: r.field_path,
        operator: r.operator,
        value: r.value,
        sort_order: r.sort_order
      })),
      nested_groups: [], // Handle nested groups if needed
      sort_order: rg.sort_order
    }));

    offerVersion = {
      id: currentVersion.id,
      offer_id: currentVersion.offer_id,
      version_number: currentVersion.version_number,
      benefit_config: currentVersion.benefit_config || {},
      qualifying_filters: currentVersion.qualifying_filters || {},
      caps_config: currentVersion.caps_config || {
        rounding: 'half_up',
        apply_pre_tax: true,
        apply_to_fees: false
      },
      rule_groups: ruleGroups
    };
  }

  return {
    id: dbOffer.id,
    name: dbOffer.name,
    description: dbOffer.description,
    marketing_text: dbOffer.marketing_text,
    offer_type: dbOffer.offer_type,
    offer_scope: dbOffer.offer_scope,
    status: dbOffer.status,
    priority: dbOffer.priority,
    stacking_policy: dbOffer.stacking_policy,
    stack_group: dbOffer.stack_group,
    funded_by: dbOffer.funded_by,
    campaign_id: dbOffer.campaign_id,
    channels: dbOffer.channels || ['web'],
    regions: dbOffer.regions || [],
    order_types: dbOffer.order_types || ['delivery', 'pickup'],
    valid_from: dbOffer.valid_from,
    valid_until: dbOffer.valid_until,
    max_uses_total: dbOffer.max_uses_total,
    max_uses_per_user: dbOffer.max_uses_per_user,
    current_version: offerVersion
  };
}

// Main evaluation function
export async function evaluateOffersForCart(
  cart: Cart,
  user: User | null = null,
  context: EvaluationContext = { current_time: new Date(), channel: 'web' }
): Promise<EvaluationResult> {
  const offers = await fetchActiveOffers();
  
  return evaluateOffersSync(offers, cart, user, context);
}

// Synchronous evaluation (for when offers are already loaded)
export function evaluateOffersSync(
  offers: Offer[],
  cart: Cart,
  user: User | null = null,
  context: EvaluationContext = { current_time: new Date(), channel: 'web' }
): EvaluationResult {
  const applicableOffers: Offer[] = [];
  const plans: ApplicationPlan[] = [];
  const messages: string[] = [];
  const potentialOffers: Array<{ offer: Offer; missing_conditions: string[] }> = [];

  // Sort offers by priority (lower number = higher priority)
  const sortedOffers = [...offers].sort((a, b) => a.priority - b.priority);

  for (const offer of sortedOffers) {
    // Check eligibility
    const eligibility = evaluateOfferEligibility(offer, cart, user, context);
    
    if (!eligibility.eligible) {
      // Track as potential offer if close to qualifying
      if (eligibility.missing_conditions.length <= 2) {
        potentialOffers.push({
          offer,
          missing_conditions: eligibility.missing_conditions
        });
      }
      continue;
    }

    // Get strategy for this offer type
    const strategy = createStrategy(offer);
    if (!strategy) {
      messages.push(`Strategy not implemented for offer type: ${offer.offer_type}`);
      continue;
    }

    // Compute derived fields and filter qualifying items
    const qualifyingFilters = offer.current_version?.qualifying_filters || {};
    const qualifyingItems = filterQualifyingItems(cart.items, qualifyingFilters);
    
    if (qualifyingItems.length === 0) {
      messages.push(`No qualifying items for offer: ${offer.name}`);
      continue;
    }

    const derivedFields = computeDerivedFields(cart, qualifyingFilters);

    // Compute benefit
    const strategyContext: StrategyContext = {
      offer,
      cart,
      qualifyingItems,
      derivedFields
    };

    const result = strategy.compute(strategyContext);

    if (result.totalDiscount > 0) {
      applicableOffers.push(offer);
      
      plans.push({
        offer_id: offer.id,
        offer_name: offer.name,
        scope: offer.offer_scope,
        total_discount: result.totalDiscount,
        line_adjustments: result.lineAdjustments,
        affected_line_ids: result.lineAdjustments.map(adj => adj.line_id),
        funded_by: offer.funded_by,
        campaign_id: offer.campaign_id,
        display_text: result.displayText
      });
    }
  }

  return {
    applicable_offers: applicableOffers,
    plans,
    messages,
    potential_offers: potentialOffers
  };
}

// Calculate total discount from plans
export function calculateTotalDiscount(plans: ApplicationPlan[]): number {
  return plans.reduce((total, plan) => total + plan.total_discount, 0);
}
