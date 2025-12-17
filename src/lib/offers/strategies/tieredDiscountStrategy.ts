// Tiered discount strategy - quantity-based pricing tiers
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

interface Tier {
  min_qty: number;
  max_qty?: number;
  discount?: number; // percent discount (legacy)
  discount_percent?: number;
  discount_amount?: number;
  price_per_unit?: number;
}

export class TieredDiscountStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems } = ctx;
    const rawTiers = this.benefitConfig.tiers || [];
    
    if (rawTiers.length === 0 || qualifyingItems.length === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Normalize tiers
    const tiers: Tier[] = rawTiers.map(t => ({
      min_qty: t.min_qty,
      max_qty: t.max_qty,
      discount: t.discount,
      discount_percent: t.discount_percent ?? t.discount,
      discount_amount: t.discount_amount,
      price_per_unit: t.price_per_unit
    }));

    // Sort tiers by min_qty descending to find best matching tier
    const sortedTiers = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
    
    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    // Apply tiered pricing per item or across all qualifying items
    const applyPerItem = this.benefitConfig.apply_per_item !== false;

    if (applyPerItem) {
      // Apply tier based on each item's quantity
      for (const item of qualifyingItems) {
        const tier = this.findMatchingTier(sortedTiers, item.quantity);
        if (tier) {
          const discount = this.calculateTierDiscount(tier, item.unit_price, item.quantity);
          const cappedDiscount = this.applyCaps(discount, item.unit_price * item.quantity);
          
          if (cappedDiscount > 0) {
            totalDiscount += cappedDiscount;
            lineAdjustments.push(this.createLineAdjustment(
              item.line_id || item.id,
              cappedDiscount,
              this.getTierDisplayText(tier)
            ));
          }
        }
      }
    } else {
      // Apply tier based on total quantity across all items
      const totalQuantity = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);
      const tier = this.findMatchingTier(sortedTiers, totalQuantity);
      
      if (tier) {
        // Distribute discount proportionally across items
        const totalValue = qualifyingItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        
        for (const item of qualifyingItems) {
          const itemValue = item.unit_price * item.quantity;
          const itemProportion = itemValue / totalValue;
          const baseDiscount = this.calculateTierDiscount(tier, item.unit_price, item.quantity);
          const proportionalDiscount = baseDiscount * itemProportion * (qualifyingItems.length);
          const cappedDiscount = this.applyCaps(proportionalDiscount, itemValue);
          
          if (cappedDiscount > 0) {
            totalDiscount += cappedDiscount;
            lineAdjustments.push(this.createLineAdjustment(
              item.line_id || item.id,
              cappedDiscount,
              this.getTierDisplayText(tier)
            ));
          }
        }
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: this.getDisplayText()
    };
  }

  private findMatchingTier(sortedTiers: Tier[], quantity: number): Tier | null {
    for (const tier of sortedTiers) {
      if (quantity >= tier.min_qty) {
        if (tier.max_qty === undefined || quantity <= tier.max_qty) {
          return tier;
        }
      }
    }
    return null;
  }

  private calculateTierDiscount(tier: Tier, unitPrice: number, quantity: number): number {
    if (tier.discount_percent !== undefined) {
      return (unitPrice * quantity * tier.discount_percent) / 100;
    }
    
    if (tier.discount_amount !== undefined) {
      return tier.discount_amount * quantity;
    }
    
    if (tier.price_per_unit !== undefined) {
      const originalTotal = unitPrice * quantity;
      const newTotal = tier.price_per_unit * quantity;
      return Math.max(0, originalTotal - newTotal);
    }
    
    return 0;
  }

  private getTierDisplayText(tier: Tier): string {
    if (tier.discount_percent) {
      return `${tier.discount_percent}% off (Buy ${tier.min_qty}+)`;
    }
    if (tier.discount_amount) {
      return `₹${tier.discount_amount} off each (Buy ${tier.min_qty}+)`;
    }
    if (tier.price_per_unit) {
      return `₹${tier.price_per_unit} each (Buy ${tier.min_qty}+)`;
    }
    return this.getDisplayText();
  }
}
