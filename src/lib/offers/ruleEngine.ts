import type { 
  Cart, User, EvaluationContext, 
  Rule, RuleGroup, Offer, DerivedFields,
  CartLineItem
} from './types';
import { resolveFieldPath } from './fieldResolver';
import { evaluateOperator } from './operators';
import { computeDerivedFields } from './derivedFields';

interface RuleEvaluationContext {
  cart: Cart;
  user: User | null;
  context: EvaluationContext;
  derived: DerivedFields;
  line?: CartLineItem;
}

interface RuleResult {
  passed: boolean;
  rule_id: string;
  field_path: string;
  actual_value: unknown;
  expected_value: unknown;
  operator: string;
}

interface GroupResult {
  passed: boolean;
  group_id: string;
  logic: string;
  rule_results: RuleResult[];
  nested_results: GroupResult[];
}

export interface EligibilityResult {
  eligible: boolean;
  offer_id: string;
  group_results: GroupResult[];
  missing_conditions: string[];
}

/**
 * Main rule evaluation engine
 * Evaluates offer eligibility based on cart, user, and context
 */
export function evaluateOfferEligibility(
  offer: Offer,
  cart: Cart,
  user: User | null,
  context: EvaluationContext
): EligibilityResult {
  const version = offer.current_version;
  
  if (!version) {
    return {
      eligible: false,
      offer_id: offer.id,
      group_results: [],
      missing_conditions: ['No active offer version'],
    };
  }

  // Check basic constraints first (fast path)
  const basicCheck = checkBasicConstraints(offer, context);
  if (!basicCheck.passed) {
    return {
      eligible: false,
      offer_id: offer.id,
      group_results: [],
      missing_conditions: basicCheck.reasons,
    };
  }

  // Compute derived fields for rule evaluation
  const derived = computeDerivedFields(cart, version.qualifying_filters);

  const evalContext: RuleEvaluationContext = {
    cart,
    user,
    context,
    derived,
  };

  // Evaluate rule groups
  const groupResults: GroupResult[] = [];
  const missingConditions: string[] = [];

  for (const ruleGroup of version.rule_groups) {
    const result = evaluateRuleGroup(ruleGroup, evalContext);
    groupResults.push(result);
    
    if (!result.passed) {
      missingConditions.push(...extractMissingConditions(result));
    }
  }

  // All top-level groups must pass (implicit AND)
  const allGroupsPassed = groupResults.every(r => r.passed);

  return {
    eligible: allGroupsPassed,
    offer_id: offer.id,
    group_results: groupResults,
    missing_conditions: allGroupsPassed ? [] : missingConditions,
  };
}

/**
 * Pre-filter check for basic offer constraints (fast path)
 */
function checkBasicConstraints(
  offer: Offer,
  context: EvaluationContext
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const now = context.current_time;

  // Check status
  if (offer.status !== 'active') {
    reasons.push(`Offer is ${offer.status}`);
  }

  // Check validity window
  if (offer.valid_from && new Date(offer.valid_from) > now) {
    reasons.push('Offer has not started yet');
  }
  if (offer.valid_until && new Date(offer.valid_until) < now) {
    reasons.push('Offer has expired');
  }

  // Check channel
  if (offer.channels.length > 0 && !offer.channels.includes(context.channel)) {
    reasons.push(`Not available on ${context.channel} channel`);
  }

  // Check region
  if (offer.regions.length > 0 && context.region && !offer.regions.includes(context.region)) {
    reasons.push(`Not available in ${context.region} region`);
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

/**
 * Evaluates a rule group (handles ALL/ANY logic and nesting)
 */
function evaluateRuleGroup(
  group: RuleGroup,
  ctx: RuleEvaluationContext
): GroupResult {
  const ruleResults: RuleResult[] = [];
  const nestedResults: GroupResult[] = [];

  // Evaluate individual rules
  for (const rule of group.rules.sort((a, b) => a.sort_order - b.sort_order)) {
    ruleResults.push(evaluateRule(rule, ctx));
  }

  // Evaluate nested groups
  for (const nested of group.nested_groups.sort((a, b) => a.sort_order - b.sort_order)) {
    nestedResults.push(evaluateRuleGroup(nested, ctx));
  }

  // Combine results based on logic
  const allResults = [
    ...ruleResults.map(r => r.passed),
    ...nestedResults.map(r => r.passed),
  ];

  let passed: boolean;
  if (group.logic === 'all') {
    passed = allResults.every(r => r);
  } else {
    passed = allResults.some(r => r);
  }

  return {
    passed,
    group_id: group.id,
    logic: group.logic,
    rule_results: ruleResults,
    nested_results: nestedResults,
  };
}

/**
 * Evaluates a single rule
 */
function evaluateRule(rule: Rule, ctx: RuleEvaluationContext): RuleResult {
  const actualValue = resolveFieldPath(rule.field_path, ctx);
  const passed = evaluateOperator(rule.operator, actualValue, rule.value);

  return {
    passed,
    rule_id: rule.id,
    field_path: rule.field_path,
    actual_value: actualValue,
    expected_value: rule.value,
    operator: rule.operator,
  };
}

/**
 * Extracts human-readable missing conditions from failed group
 */
function extractMissingConditions(result: GroupResult): string[] {
  const conditions: string[] = [];

  for (const rule of result.rule_results) {
    if (!rule.passed) {
      conditions.push(formatMissingCondition(rule));
    }
  }

  for (const nested of result.nested_results) {
    if (!nested.passed) {
      conditions.push(...extractMissingConditions(nested));
    }
  }

  return conditions;
}

/**
 * Formats a failed rule as human-readable condition
 */
function formatMissingCondition(rule: RuleResult): string {
  const { field_path, operator, expected_value, actual_value } = rule;
  
  const fieldName = field_path.split('.').pop() || field_path;
  
  switch (operator) {
    case 'gte':
      return `${fieldName} must be at least ${expected_value} (current: ${actual_value})`;
    case 'lte':
      return `${fieldName} must be at most ${expected_value} (current: ${actual_value})`;
    case 'gt':
      return `${fieldName} must be greater than ${expected_value}`;
    case 'lt':
      return `${fieldName} must be less than ${expected_value}`;
    case 'eq':
      return `${fieldName} must equal ${expected_value}`;
    case 'in':
      return `${fieldName} must be one of: ${Array.isArray(expected_value) ? expected_value.join(', ') : expected_value}`;
    case 'between':
      return `${fieldName} must be between ${Array.isArray(expected_value) ? expected_value.join(' and ') : expected_value}`;
    default:
      return `${fieldName} condition not met`;
  }
}

/**
 * Evaluates eligibility for a specific line item (for item-scoped offers)
 */
export function evaluateLineItemEligibility(
  offer: Offer,
  cart: Cart,
  lineItem: CartLineItem,
  user: User | null,
  context: EvaluationContext
): EligibilityResult {
  const version = offer.current_version;
  
  if (!version) {
    return {
      eligible: false,
      offer_id: offer.id,
      group_results: [],
      missing_conditions: ['No active offer version'],
    };
  }

  const derived = computeDerivedFields(cart, version.qualifying_filters);

  const evalContext: RuleEvaluationContext = {
    cart,
    user,
    context,
    derived,
    line: lineItem,
  };

  const groupResults: GroupResult[] = [];
  const missingConditions: string[] = [];

  for (const ruleGroup of version.rule_groups) {
    const result = evaluateRuleGroup(ruleGroup, evalContext);
    groupResults.push(result);
    
    if (!result.passed) {
      missingConditions.push(...extractMissingConditions(result));
    }
  }

  const allGroupsPassed = groupResults.every(r => r.passed);

  return {
    eligible: allGroupsPassed,
    offer_id: offer.id,
    group_results: groupResults,
    missing_conditions: allGroupsPassed ? [] : missingConditions,
  };
}
