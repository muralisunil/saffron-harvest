// Free gift strategy - adds a free gift when conditions are met
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { LineItemAdjustment } from '../types';

export interface FreeGiftItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  max_per_order?: number;
}

export class FreeGiftStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems, cart } = ctx;
    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    // Get configuration
    const giftItems = this.benefitConfig.gift_items as FreeGiftItem[] | undefined;
    const minCartValue = this.benefitConfig.min_cart_value ?? 0;
    const minQualifyingQty = this.benefitConfig.min_qualifying_qty ?? 0;

    if (!giftItems || giftItems.length === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Check cart value threshold
    if (cart.subtotal < minCartValue) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Check qualifying quantity
    const totalQualifyingQty = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQualifyingQty < minQualifyingQty) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Check if gift items are already in cart and apply discount
    for (const gift of giftItems) {
      const giftInCart = cart.line_items.find(item => 
        item.product_id === gift.product_id && 
        (!gift.variant_id || item.variant_id === gift.variant_id)
      );

      if (giftInCart) {
        // Determine how many units qualify as free
        const maxFreeQty = gift.max_per_order ?? gift.quantity;
        const freeQty = Math.min(giftInCart.quantity, maxFreeQty);
        
        // Full discount on the free gift items
        const giftDiscount = giftInCart.unit_price * freeQty;
        const cappedDiscount = this.applyCaps(giftDiscount, giftInCart.unit_price * freeQty);

        if (cappedDiscount > 0) {
          totalDiscount += cappedDiscount;
          lineAdjustments.push(
            this.createLineAdjustment(
              giftInCart.line_id,
              cappedDiscount,
              `Free Gift: ${this.getDisplayText()}`
            )
          );
        }
      }
    }

    // Note: In a full implementation, you might also want to:
    // 1. Auto-add gift items to cart
    // 2. Return gift item metadata for UI to show available gifts
    // 3. Track gift inventory

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: this.getDisplayText(),
    };
  }

  // Helper to get available gift items (for UI display)
  getAvailableGifts(): FreeGiftItem[] {
    return (this.benefitConfig.gift_items as FreeGiftItem[]) || [];
  }
}
