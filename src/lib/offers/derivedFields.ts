import type { Cart, CartLineItem, QualifyingFilters, DerivedFields } from './types';

/**
 * Computes derived fields from cart and qualifying filters
 * These fields enable complex rule conditions without scanning ad-hoc
 */
export function computeDerivedFields(
  cart: Cart,
  filters?: QualifyingFilters
): DerivedFields {
  const qualifyingItems = filters 
    ? filterQualifyingItems(cart.items, filters)
    : cart.items;

  return {
    eligible_item_count: qualifyingItems.length,
    category_totals: computeCategoryTotals(cart.items),
    brand_totals: computeBrandTotals(cart.items),
    tag_totals: computeTagTotals(cart.items),
    total_quantity: computeTotalQuantity(qualifyingItems),
    distinct_sku_count: computeDistinctSkuCount(qualifyingItems),
    qualifying_items: qualifyingItems,
  };
}

/**
 * Filters cart items based on qualifying filters
 */
export function filterQualifyingItems(
  items: CartLineItem[],
  filters: QualifyingFilters
): CartLineItem[] {
  return items.filter(item => {
    // Check exclusions first
    if (filters.exclude_skus?.includes(item.sku)) return false;
    if (item.category && filters.exclude_categories?.includes(item.category)) return false;

    // If no inclusion filters, item qualifies (after passing exclusions)
    const hasInclusionFilters = 
      filters.skus?.length || 
      filters.categories?.length || 
      filters.brands?.length || 
      filters.tags?.length ||
      filters.temperature_zones?.length;

    if (!hasInclusionFilters) return true;

    // Check inclusion filters (any match qualifies)
    if (filters.skus?.length && filters.skus.includes(item.sku)) return true;
    if (filters.categories?.length && item.category && filters.categories.includes(item.category)) return true;
    if (filters.brands?.length && item.brand && filters.brands.includes(item.brand)) return true;
    if (filters.tags?.length && item.tags?.some(t => filters.tags?.includes(t))) return true;
    if (filters.temperature_zones?.length && item.temperature_zone && filters.temperature_zones.includes(item.temperature_zone)) return true;

    return false;
  });
}

/**
 * Computes total amount per category
 */
function computeCategoryTotals(items: CartLineItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const item of items) {
    if (item.category) {
      totals[item.category] = (totals[item.category] || 0) + item.extended_price;
    }
  }
  
  return totals;
}

/**
 * Computes total amount per brand
 */
function computeBrandTotals(items: CartLineItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const item of items) {
    if (item.brand) {
      totals[item.brand] = (totals[item.brand] || 0) + item.extended_price;
    }
  }
  
  return totals;
}

/**
 * Computes total amount per tag
 */
function computeTagTotals(items: CartLineItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const item of items) {
    if (item.tags) {
      for (const tag of item.tags) {
        totals[tag] = (totals[tag] || 0) + item.extended_price;
      }
    }
  }
  
  return totals;
}

/**
 * Computes total quantity of qualifying items
 */
function computeTotalQuantity(items: CartLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Computes count of distinct SKUs
 */
function computeDistinctSkuCount(items: CartLineItem[]): number {
  const uniqueSkus = new Set(items.map(item => item.sku));
  return uniqueSkus.size;
}

/**
 * Gets items sorted by price (for cheapest/highest selection strategies)
 */
export function getItemsSortedByPrice(
  items: CartLineItem[],
  order: 'asc' | 'desc' = 'asc'
): CartLineItem[] {
  return [...items].sort((a, b) => {
    const diff = a.unit_price - b.unit_price;
    return order === 'asc' ? diff : -diff;
  });
}

/**
 * Selects items based on selection strategy
 */
export function selectItems(
  items: CartLineItem[],
  strategy: 'lowest_priced' | 'highest_priced' | 'nth_item',
  count: number,
  nthIndex?: number
): CartLineItem[] {
  if (items.length === 0) return [];

  switch (strategy) {
    case 'lowest_priced':
      return getItemsSortedByPrice(items, 'asc').slice(0, count);
    
    case 'highest_priced':
      return getItemsSortedByPrice(items, 'desc').slice(0, count);
    
    case 'nth_item':
      const idx = (nthIndex ?? 1) - 1;
      return idx >= 0 && idx < items.length ? [items[idx]] : [];
    
    default:
      return items.slice(0, count);
  }
}

/**
 * Groups items for mix-and-match or combo offers
 */
export function groupItemsForCombo(
  items: CartLineItem[],
  groupSize: number
): CartLineItem[][] {
  const groups: CartLineItem[][] = [];
  const sortedItems = getItemsSortedByPrice(items, 'asc');
  
  for (let i = 0; i < sortedItems.length; i += groupSize) {
    const group = sortedItems.slice(i, i + groupSize);
    if (group.length === groupSize) {
      groups.push(group);
    }
  }
  
  return groups;
}
