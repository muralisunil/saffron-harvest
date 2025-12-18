// Cashback strategy - provides cashback rewards (credited after purchase)
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export interface CashbackResult extends StrategyResult {
  cashbackAmount: number;
  cashbackType: 'percent' | 'flat';
  creditTiming: 'immediate' | 'after_delivery' | 'after_return_window';
}

export class CashbackStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): CashbackResult {
    const { qualifyingItems, cart } = ctx;
    const lineAdjustments: LineItemAdjustment[] = [];

    // Get configuration
    const cashbackPercent = this.benefitConfig.cashback_percent;
    const cashbackAmount = this.benefitConfig.cashback_amount;
    const minCartValue = this.benefitConfig.min_cart_value ?? 0;
    const maxCashback = this.benefitConfig.max_cashback;
    const creditTiming = (this.benefitConfig.credit_timing as CashbackResult['creditTiming']) ?? 'after_delivery';
    const applyToQualifyingOnly = this.benefitConfig.apply_to_qualifying_only ?? true;

    // Check cart value threshold
    if (cart.subtotal < minCartValue) {
      return {
        totalDiscount: 0,
        lineAdjustments: [],
        displayText: this.getDisplayText(),
        cashbackAmount: 0,
        cashbackType: cashbackPercent ? 'percent' : 'flat',
        creditTiming
      };
    }

    let calculatedCashback = 0;
    const cashbackType: 'percent' | 'flat' = cashbackPercent ? 'percent' : 'flat';

    if (cashbackPercent) {
      // Calculate cashback based on percentage
      const baseAmount = applyToQualifyingOnly
        ? qualifyingItems.reduce((sum, item) => sum + item.line_total, 0)
        : cart.subtotal;
      
      calculatedCashback = (baseAmount * cashbackPercent) / 100;

      // Create line adjustments for tracking (but not actual discount)
      if (applyToQualifyingOnly) {
        for (const item of qualifyingItems) {
          const itemCashback = (item.line_total * cashbackPercent) / 100;
          if (itemCashback > 0) {
            lineAdjustments.push({
              line_id: item.line_id,
              offer_id: this.offer.id,
              amount: 0, // Cashback doesn't reduce current order total
              display_text: `${cashbackPercent}% Cashback`,
              metadata: { cashback_amount: this.applyRounding(itemCashback) }
            });
          }
        }
      }
    } else if (cashbackAmount) {
      // Flat cashback amount
      calculatedCashback = cashbackAmount;
    }

    // Apply max cashback cap
    if (maxCashback !== undefined && maxCashback !== null) {
      calculatedCashback = Math.min(calculatedCashback, maxCashback);
    }

    calculatedCashback = this.applyRounding(calculatedCashback);

    // Note: Cashback doesn't reduce the current order total
    // It's credited to user's account based on creditTiming
    return {
      totalDiscount: 0, // No immediate discount
      lineAdjustments,
      displayText: this.getDisplayText(),
      cashbackAmount: calculatedCashback,
      cashbackType,
      creditTiming
    };
  }
}
