// Price override strategy implementation
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export class PriceOverrideStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems } = ctx;
    const overridePrice = this.benefitConfig.discount_amount; // Using discount_amount as target price
    
    if (overridePrice === undefined || overridePrice === null || overridePrice < 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: '' };
    }

    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    for (const item of qualifyingItems) {
      // Calculate discount needed to bring unit price to override price
      const originalUnitPrice = item.unit_price;
      
      if (overridePrice < originalUnitPrice) {
        const discountPerUnit = originalUnitPrice - overridePrice;
        const totalItemDiscount = discountPerUnit * item.quantity;
        const cappedDiscount = this.applyCaps(totalItemDiscount, item.extended_price);
        
        if (cappedDiscount > 0) {
          lineAdjustments.push(this.createLineAdjustment(
            item.id,
            cappedDiscount,
            `Special price: ₹${overridePrice}`
          ));
          totalDiscount += cappedDiscount;
        }
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: `Special price: ₹${overridePrice}${this.offer.marketing_text ? ` - ${this.offer.marketing_text}` : ''}`
    };
  }
}
