// Cheapest item discount strategy - discounts the lowest-priced qualifying item
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment, CartLineItem } from '../types';

export class CheapestItemStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems } = ctx;
    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    if (qualifyingItems.length === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Get configuration
    const discountPercent = this.benefitConfig.discount_percent ?? 100; // Default to free
    const minQualifyingItems = this.benefitConfig.min_qualifying_items ?? 2;
    const maxItems = this.benefitConfig.max_items ?? 1; // How many cheapest items to discount

    // Check minimum qualifying items requirement
    const totalQualifyingQty = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQualifyingQty < minQualifyingItems) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Expand items by quantity and sort by unit price (ascending)
    const expandedItems: { item: CartLineItem; unitPrice: number }[] = [];
    for (const item of qualifyingItems) {
      const unitPrice = item.unit_price;
      for (let i = 0; i < item.quantity; i++) {
        expandedItems.push({ item, unitPrice });
      }
    }
    expandedItems.sort((a, b) => a.unitPrice - b.unitPrice);

    // Take the cheapest items up to maxItems
    const itemsToDiscount = expandedItems.slice(0, maxItems);

    // Group discounts by line_id
    const discountsByLine = new Map<string, number>();
    
    for (const { item, unitPrice } of itemsToDiscount) {
      const discount = (unitPrice * discountPercent) / 100;
      const cappedDiscount = this.applyCaps(discount, unitPrice);
      
      const existing = discountsByLine.get(item.line_id) || 0;
      discountsByLine.set(item.line_id, existing + cappedDiscount);
    }

    // Create line adjustments
    for (const [lineId, discount] of discountsByLine) {
      if (discount > 0) {
        totalDiscount += discount;
        lineAdjustments.push(this.createLineAdjustment(lineId, discount));
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: this.getDisplayText()
    };
  }
}
