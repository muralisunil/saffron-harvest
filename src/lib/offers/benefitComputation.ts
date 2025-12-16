// Benefit Computation Engine - Phase 3
import type {
  Offer,
  Cart,
  CartLineItem,
  BenefitConfig,
  CapsConfig,
  ApplicationPlan,
  LineItemAdjustment,
  DerivedFields,
} from './types';

// Rounding utilities
export function applyRounding(value: number, rounding: CapsConfig['rounding']): number {
  switch (rounding) {
    case 'floor':
      return Math.floor(value * 100) / 100;
    case 'ceil':
      return Math.ceil(value * 100) / 100;
    case 'half_up':
    default:
      return Math.round(value * 100) / 100;
  }
}

// Apply caps and floors to a discount amount
export function applyCapsAndFloors(
  discount: number,
  originalPrice: number,
  caps: CapsConfig
): number {
  let finalDiscount = discount;

  // Apply max discount cap
  if (caps.max_discount_amount !== undefined && caps.max_discount_amount !== null) {
    finalDiscount = Math.min(finalDiscount, caps.max_discount_amount);
  }

  // Apply min price floor - ensure price doesn't go below floor
  if (caps.min_price_floor !== undefined && caps.min_price_floor !== null) {
    const maxAllowedDiscount = originalPrice - caps.min_price_floor;
    finalDiscount = Math.min(finalDiscount, Math.max(0, maxAllowedDiscount));
  }

  // Ensure discount is never negative
  finalDiscount = Math.max(0, finalDiscount);

  // Apply rounding
  return applyRounding(finalDiscount, caps.rounding);
}

// Calculate percent discount
function calculatePercentDiscount(
  amount: number,
  percent: number,
  caps: CapsConfig
): number {
  const rawDiscount = amount * (percent / 100);
  return applyCapsAndFloors(rawDiscount, amount, caps);
}

// Calculate flat discount
function calculateFlatDiscount(
  amount: number,
  flatAmount: number,
  caps: CapsConfig
): number {
  return applyCapsAndFloors(flatAmount, amount, caps);
}

// Get default caps config
function getDefaultCaps(caps?: CapsConfig): CapsConfig {
  return {
    rounding: caps?.rounding ?? 'half_up',
    apply_pre_tax: caps?.apply_pre_tax ?? true,
    apply_to_fees: caps?.apply_to_fees ?? false,
    max_discount_amount: caps?.max_discount_amount,
    min_price_floor: caps?.min_price_floor,
  };
}

// Compute benefit for a single line item
export function computeLineItemBenefit(
  item: CartLineItem,
  benefit: BenefitConfig,
  caps: CapsConfig,
  offerType: string
): LineItemAdjustment | null {
  const capsConfig = getDefaultCaps(caps);
  let discount = 0;
  let displayText = '';

  switch (offerType) {
    case 'percent_discount':
      if (benefit.discount_percent) {
        discount = calculatePercentDiscount(
          item.extended_price,
          benefit.discount_percent,
          capsConfig
        );
        displayText = `${benefit.discount_percent}% off`;
      }
      break;

    case 'flat_discount':
      if (benefit.discount_amount) {
        discount = calculateFlatDiscount(
          item.extended_price,
          benefit.discount_amount,
          capsConfig
        );
        displayText = `₹${benefit.discount_amount} off`;
      }
      break;

    case 'price_override':
      if (benefit.discount_amount !== undefined) {
        const overrideDiscount = item.unit_price - benefit.discount_amount;
        discount = applyCapsAndFloors(
          overrideDiscount * item.quantity,
          item.extended_price,
          capsConfig
        );
        displayText = `Special price ₹${benefit.discount_amount}`;
      }
      break;

    default:
      return null;
  }

  if (discount <= 0) return null;

  return {
    line_id: item.id,
    offer_id: '',
    amount: discount,
    display_text: displayText,
  };
}

// Compute tiered discount based on quantity
export function computeTieredDiscount(
  items: CartLineItem[],
  benefit: BenefitConfig,
  caps: CapsConfig
): { discount: number; tier: { min_qty: number; max_qty?: number; discount: number } | null } {
  if (!benefit.tiers || benefit.tiers.length === 0) {
    return { discount: 0, tier: null };
  }

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.extended_price, 0);

  // Find applicable tier (sorted by min_qty descending to get highest applicable)
  const sortedTiers = [...benefit.tiers].sort((a, b) => b.min_qty - a.min_qty);
  const applicableTier = sortedTiers.find(tier => {
    const meetsMin = totalQty >= tier.min_qty;
    const meetsMax = tier.max_qty === undefined || totalQty <= tier.max_qty;
    return meetsMin && meetsMax;
  });

  if (!applicableTier) {
    return { discount: 0, tier: null };
  }

  const capsConfig = getDefaultCaps(caps);
  const rawDiscount = totalAmount * (applicableTier.discount / 100);
  const finalDiscount = applyCapsAndFloors(rawDiscount, totalAmount, capsConfig);

  return { discount: finalDiscount, tier: applicableTier };
}

// Compute Buy X Get Y discount
export function computeBuyXGetY(
  items: CartLineItem[],
  benefit: BenefitConfig,
  caps: CapsConfig
): { discount: number; freeItems: number } {
  const buyQty = benefit.buy_qty ?? 1;
  const getQty = benefit.get_qty ?? 1;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalQty < buyQty + getQty) {
    return { discount: 0, freeItems: 0 };
  }

  // Calculate how many complete "sets" of buy+get we have
  const setsCount = Math.floor(totalQty / (buyQty + getQty));
  const freeItems = setsCount * getQty;

  // Sort items by price to make cheapest items free
  const sortedItems = [...items].sort((a, b) => a.unit_price - b.unit_price);
  
  let remainingFree = freeItems;
  let totalDiscount = 0;

  for (const item of sortedItems) {
    if (remainingFree <= 0) break;
    const freeFromItem = Math.min(remainingFree, item.quantity);
    totalDiscount += freeFromItem * item.unit_price;
    remainingFree -= freeFromItem;
  }

  const capsConfig = getDefaultCaps(caps);
  const totalAmount = items.reduce((sum, item) => sum + item.extended_price, 0);
  const finalDiscount = applyCapsAndFloors(totalDiscount, totalAmount, capsConfig);

  return { discount: finalDiscount, freeItems };
}

// Compute cheapest item free/discounted
export function computeCheapestItem(
  items: CartLineItem[],
  benefit: BenefitConfig,
  caps: CapsConfig
): { discount: number; affectedItem: CartLineItem | null } {
  if (items.length === 0) {
    return { discount: 0, affectedItem: null };
  }

  const groupSize = benefit.group_size ?? items.length;
  if (items.length < groupSize) {
    return { discount: 0, affectedItem: null };
  }

  // Sort by unit price ascending
  const sortedItems = [...items].sort((a, b) => a.unit_price - b.unit_price);
  const cheapestItem = sortedItems[0];

  const discountPercent = benefit.discount_percent ?? 100; // Default to free
  const rawDiscount = cheapestItem.unit_price * (discountPercent / 100);

  const capsConfig = getDefaultCaps(caps);
  const totalAmount = items.reduce((sum, item) => sum + item.extended_price, 0);
  const finalDiscount = applyCapsAndFloors(rawDiscount, totalAmount, capsConfig);

  return { discount: finalDiscount, affectedItem: cheapestItem };
}

// Compute cart-level threshold discount
export function computeThresholdDiscount(
  cart: Cart,
  benefit: BenefitConfig,
  caps: CapsConfig
): { discount: number; qualifies: boolean } {
  const threshold = benefit.threshold_amount ?? 0;
  
  if (cart.subtotal < threshold) {
    return { discount: 0, qualifies: false };
  }

  const capsConfig = getDefaultCaps(caps);
  let rawDiscount = 0;

  if (benefit.discount_percent) {
    rawDiscount = cart.subtotal * (benefit.discount_percent / 100);
  } else if (benefit.discount_amount) {
    rawDiscount = benefit.discount_amount;
  }

  const finalDiscount = applyCapsAndFloors(rawDiscount, cart.subtotal, capsConfig);

  return { discount: finalDiscount, qualifies: true };
}

// Main benefit computation function
export function computeOfferBenefit(
  offer: Offer,
  cart: Cart,
  qualifyingItems: CartLineItem[],
  derived: DerivedFields
): ApplicationPlan | null {
  const version = offer.current_version;
  if (!version) return null;

  const benefit = version.benefit_config;
  const caps = version.caps_config ?? {
    rounding: 'half_up',
    apply_pre_tax: true,
    apply_to_fees: false,
  };

  let totalDiscount = 0;
  const lineAdjustments: LineItemAdjustment[] = [];
  const affectedLineIds: string[] = [];
  let displayText = offer.marketing_text || offer.name;

  switch (offer.offer_type) {
    case 'percent_discount':
    case 'flat_discount':
    case 'price_override':
      // Apply to qualifying items
      for (const item of qualifyingItems) {
        const adjustment = computeLineItemBenefit(item, benefit, caps, offer.offer_type);
        if (adjustment) {
          adjustment.offer_id = offer.id;
          lineAdjustments.push(adjustment);
          totalDiscount += adjustment.amount;
          affectedLineIds.push(item.id);
        }
      }
      break;

    case 'tiered_discount': {
      const { discount, tier } = computeTieredDiscount(qualifyingItems, benefit, caps);
      if (discount > 0 && tier) {
        totalDiscount = discount;
        displayText = `${tier.discount}% off (${tier.min_qty}+ items)`;
        affectedLineIds.push(...qualifyingItems.map(i => i.id));
      }
      break;
    }

    case 'buy_x_get_y': {
      const { discount, freeItems } = computeBuyXGetY(qualifyingItems, benefit, caps);
      if (discount > 0) {
        totalDiscount = discount;
        displayText = `Buy ${benefit.buy_qty}, Get ${benefit.get_qty} Free`;
        affectedLineIds.push(...qualifyingItems.map(i => i.id));
      }
      break;
    }

    case 'cheapest_item': {
      const { discount, affectedItem } = computeCheapestItem(qualifyingItems, benefit, caps);
      if (discount > 0 && affectedItem) {
        totalDiscount = discount;
        displayText = benefit.discount_percent === 100 
          ? 'Cheapest item free!' 
          : `${benefit.discount_percent}% off cheapest item`;
        affectedLineIds.push(affectedItem.id);
      }
      break;
    }

    case 'free_gift':
      if (benefit.free_sku) {
        displayText = `Free gift included!`;
        // Free gift is handled separately in fulfillment
      }
      break;

    case 'cashback':
    case 'loyalty_points':
      // These are post-purchase benefits, computed but not applied to cart total
      if (benefit.discount_percent) {
        totalDiscount = cart.subtotal * (benefit.discount_percent / 100);
        displayText = offer.offer_type === 'cashback' 
          ? `${benefit.discount_percent}% cashback`
          : `Earn ${Math.round(totalDiscount)} points`;
      }
      break;

    default:
      return null;
  }

  if (totalDiscount === 0 && offer.offer_type !== 'free_gift') {
    return null;
  }

  return {
    offer_id: offer.id,
    offer_name: offer.name,
    scope: offer.offer_scope,
    total_discount: totalDiscount,
    line_adjustments: lineAdjustments,
    affected_line_ids: affectedLineIds,
    funded_by: offer.funded_by,
    campaign_id: offer.campaign_id,
    display_text: displayText,
  };
}
