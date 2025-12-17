// Flat discount strategy implementation
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export class FlatDiscountStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems, cart } = ctx;
    const discountAmount = this.benefitConfig.discount_amount || 0;
    
    if (discountAmount <= 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: '' };
    }

    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    if (this.offer.offer_scope === 'cart') {
      // Cart-level flat discount
      const cappedDiscount = this.applyCaps(discountAmount, cart.subtotal);
      
      if (cappedDiscount > 0 && qualifyingItems.length > 0) {
        // Distribute proportionally across qualifying items
        const qualifyingTotal = qualifyingItems.reduce((sum, item) => sum + item.extended_price, 0);
        
        for (const item of qualifyingItems) {
          const itemProportion = item.extended_price / qualifyingTotal;
          const itemDiscount = this.applyRounding(cappedDiscount * itemProportion);
          
          if (itemDiscount > 0) {
            lineAdjustments.push(this.createLineAdjustment(
              item.id,
              itemDiscount,
              `₹${discountAmount} off`
            ));
            totalDiscount += itemDiscount;
          }
        }
      }
    } else {
      // Item-level: apply flat discount to each qualifying item
      for (const item of qualifyingItems) {
        // For item-level, the discount applies per item
        const perItemDiscount = discountAmount * item.quantity;
        const cappedDiscount = this.applyCaps(perItemDiscount, item.extended_price);
        
        if (cappedDiscount > 0) {
          lineAdjustments.push(this.createLineAdjustment(
            item.id,
            cappedDiscount,
            `₹${discountAmount} off each`
          ));
          totalDiscount += cappedDiscount;
        }
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: `₹${discountAmount} off${this.offer.marketing_text ? ` - ${this.offer.marketing_text}` : ''}`
    };
  }
}
