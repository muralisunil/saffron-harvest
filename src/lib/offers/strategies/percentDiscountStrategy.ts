// Percent discount strategy implementation
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export class PercentDiscountStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems, cart } = ctx;
    const discountPercent = this.benefitConfig.discount_percent || 0;
    
    if (discountPercent <= 0 || discountPercent > 100) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: '' };
    }

    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    // Apply to qualifying items based on scope
    if (this.offer.offer_scope === 'cart') {
      // Cart-level: distribute discount across all items proportionally
      const cartSubtotal = cart.subtotal;
      const rawDiscount = cartSubtotal * (discountPercent / 100);
      const cappedDiscount = this.applyCaps(rawDiscount, cartSubtotal);
      
      // Distribute proportionally across items
      for (const item of qualifyingItems) {
        const itemProportion = item.extended_price / cartSubtotal;
        const itemDiscount = this.applyRounding(cappedDiscount * itemProportion);
        
        if (itemDiscount > 0) {
          lineAdjustments.push(this.createLineAdjustment(
            item.id,
            itemDiscount,
            `${discountPercent}% off`
          ));
          totalDiscount += itemDiscount;
        }
      }
    } else {
      // Item/category/brand level: apply to each qualifying item
      for (const item of qualifyingItems) {
        const rawDiscount = item.extended_price * (discountPercent / 100);
        const cappedDiscount = this.applyCaps(rawDiscount, item.extended_price);
        
        if (cappedDiscount > 0) {
          lineAdjustments.push(this.createLineAdjustment(
            item.id,
            cappedDiscount,
            `${discountPercent}% off`
          ));
          totalDiscount += cappedDiscount;
        }
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: `${discountPercent}% off${this.offer.marketing_text ? ` - ${this.offer.marketing_text}` : ''}`
    };
  }
}
