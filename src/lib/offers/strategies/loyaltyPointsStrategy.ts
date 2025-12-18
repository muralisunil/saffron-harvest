// Loyalty points strategy - awards bonus loyalty points on qualifying purchases
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export interface LoyaltyPointsResult extends StrategyResult {
  pointsAwarded: number;
  pointsMultiplier: number;
  basePoints: number;
  bonusPoints: number;
}

export class LoyaltyPointsStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): LoyaltyPointsResult {
    const { qualifyingItems, cart } = ctx;
    const lineAdjustments: LineItemAdjustment[] = [];

    // Get configuration
    const pointsPerDollar = this.benefitConfig.points_per_dollar ?? 1;
    const bonusPoints = this.benefitConfig.bonus_points ?? 0;
    const pointsMultiplier = this.benefitConfig.points_multiplier ?? 1;
    const minCartValue = this.benefitConfig.min_cart_value ?? 0;
    const maxPoints = this.benefitConfig.max_points;
    const applyToQualifyingOnly = this.benefitConfig.apply_to_qualifying_only ?? true;

    // Check cart value threshold
    if (cart.subtotal < minCartValue) {
      return {
        totalDiscount: 0,
        lineAdjustments: [],
        displayText: this.getDisplayText(),
        pointsAwarded: 0,
        pointsMultiplier: 1,
        basePoints: 0,
        bonusPoints: 0
      };
    }

    // Calculate base amount for points
    const baseAmount = applyToQualifyingOnly
      ? qualifyingItems.reduce((sum, item) => sum + item.line_total, 0)
      : cart.subtotal;

    // Calculate base points (before multiplier)
    const basePoints = Math.floor(baseAmount * pointsPerDollar);

    // Apply multiplier and add bonus
    let totalPoints = Math.floor(basePoints * pointsMultiplier) + bonusPoints;

    // Apply max points cap
    if (maxPoints !== undefined && maxPoints !== null) {
      totalPoints = Math.min(totalPoints, maxPoints);
    }

    // Create line adjustments for tracking
    if (applyToQualifyingOnly) {
      for (const item of qualifyingItems) {
        const itemBasePoints = Math.floor(item.line_total * pointsPerDollar);
        const itemPoints = Math.floor(itemBasePoints * pointsMultiplier);
        
        if (itemPoints > 0) {
          lineAdjustments.push({
            line_id: item.line_id,
            offer_id: this.offer.id,
            amount: 0, // Points don't reduce order total
            display_text: `+${itemPoints} Points`,
            metadata: { points_awarded: itemPoints }
          });
        }
      }
    }

    // Note: Loyalty points don't reduce the current order total
    // They're credited to user's loyalty account
    return {
      totalDiscount: 0, // No immediate discount
      lineAdjustments,
      displayText: this.getDisplayText(),
      pointsAwarded: totalPoints,
      pointsMultiplier,
      basePoints,
      bonusPoints
    };
  }

  // Helper to calculate points value in currency
  getPointsValue(points: number, pointsValueRate: number = 0.01): number {
    return this.applyRounding(points * pointsValueRate);
  }
}
