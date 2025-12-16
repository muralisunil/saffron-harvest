import type { Cart, CartLineItem, User, EvaluationContext, DerivedFields } from './types';

type ResolverContext = {
  cart: Cart;
  user: User | null;
  context: EvaluationContext;
  derived: DerivedFields;
  line?: CartLineItem;
};

/**
 * Resolves a field path to its value from the evaluation context
 * Supports paths like: cart.subtotal, user.tags, line.category, derived.category_totals.dairy
 */
export function resolveFieldPath(
  path: string,
  ctx: ResolverContext
): unknown {
  const parts = path.split('.');
  const root = parts[0];
  const rest = parts.slice(1);

  let value: unknown;

  switch (root) {
    case 'cart':
      value = resolveObjectPath(ctx.cart, rest);
      break;
    case 'user':
      value = ctx.user ? resolveObjectPath(ctx.user, rest) : null;
      break;
    case 'context':
      value = resolveObjectPath(ctx.context, rest);
      break;
    case 'line':
      value = ctx.line ? resolveObjectPath(ctx.line, rest) : null;
      break;
    case 'derived':
      value = resolveObjectPath(ctx.derived, rest);
      break;
    case 'current_time':
      value = ctx.context.current_time;
      break;
    default:
      // Try to resolve from line item attributes if we have a line context
      if (ctx.line?.attributes && root in ctx.line.attributes) {
        value = resolveObjectPath(ctx.line.attributes, [root, ...rest]);
      } else {
        value = undefined;
      }
  }

  return value;
}

/**
 * Resolves nested object path
 */
function resolveObjectPath(obj: unknown, path: string[]): unknown {
  if (path.length === 0 || obj === null || obj === undefined) {
    return obj;
  }

  const [head, ...tail] = path;
  
  if (typeof obj !== 'object') {
    return undefined;
  }

  const record = obj as Record<string, unknown>;
  const nextValue = record[head];

  if (tail.length === 0) {
    return nextValue;
  }

  return resolveObjectPath(nextValue, tail);
}

/**
 * Checks if a field path exists in the context
 */
export function fieldExists(path: string, ctx: ResolverContext): boolean {
  const value = resolveFieldPath(path, ctx);
  return value !== undefined && value !== null;
}

/**
 * Gets all available field paths for documentation/autocomplete
 */
export function getAvailableFieldPaths(): string[] {
  return [
    // Cart fields
    'cart.subtotal',
    'cart.grand_total',
    'cart.delivery_fee',
    'cart.service_fee',
    'cart.taxes',
    'cart.is_subscription',
    'cart.order_type',
    'cart.items.length',
    
    // User fields
    'user.id',
    'user.email',
    'user.tags',
    'user.segments',
    'user.lifecycle_stage',
    'user.order_count',
    'user.order_streak_weeks',
    'user.total_spend',
    'user.first_order_date',
    'user.last_order_date',
    
    // Line item fields (when evaluating per-line)
    'line.sku',
    'line.product_id',
    'line.name',
    'line.unit_price',
    'line.quantity',
    'line.extended_price',
    'line.category',
    'line.brand',
    'line.tags',
    'line.days_to_expiry',
    'line.temperature_zone',
    
    // Context fields
    'context.channel',
    'context.region',
    'context.store_id',
    'context.delivery_zone',
    'current_time',
    
    // Derived fields
    'derived.eligible_item_count',
    'derived.total_quantity',
    'derived.distinct_sku_count',
    'derived.category_totals.<category>',
    'derived.brand_totals.<brand>',
    'derived.tag_totals.<tag>',
  ];
}
