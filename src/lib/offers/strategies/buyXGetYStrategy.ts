// Buy X Get Y strategy - buy X items, get Y free or discounted
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { CartLineItem, LineItemAdjustment } from '../types';

export class BuyXGetYStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { qualifyingItems } = ctx;
    
    // Support both naming conventions
    const buyQuantity = this.benefitConfig.buy_quantity ?? this.benefitConfig.buy_qty ?? 1;
    const getQuantity = this.benefitConfig.get_quantity ?? this.benefitConfig.get_qty ?? 1;
    const getDiscountPercent = this.benefitConfig.get_discount_percent ?? 100; // Default 100% = free
    const maxSets = this.benefitConfig.max_sets;
    const selectionStrategy = this.benefitConfig.selection_strategy || 'lowest_priced';
    
    if (qualifyingItems.length === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Expand items by quantity for proper calculation
    const expandedItems = this.expandItems(qualifyingItems);
    
    // Sort items based on strategy
    const sortedItems = this.sortByStrategy(expandedItems, selectionStrategy);
    
    // Calculate how many complete sets we can form
    const setSize = buyQuantity + getQuantity;
    let availableSets = Math.floor(sortedItems.length / setSize);
    
    if (maxSets !== undefined) {
      availableSets = Math.min(availableSets, maxSets);
    }
    
    if (availableSets === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Identify free/discounted items (the "get" items in each set)
    const discountedItems: { item: CartLineItem; originalIndex: number }[] = [];
    
    for (let set = 0; set < availableSets; set++) {
      const setStartIndex = set * setSize;
      for (let i = 0; i < getQuantity; i++) {
        const itemIndex = setStartIndex + buyQuantity + i;
        if (itemIndex < sortedItems.length) {
          discountedItems.push(sortedItems[itemIndex]);
        }
      }
    }

    // Aggregate discounts back to original line items
    const lineDiscounts = new Map<string, number>();
    
    for (const { item } of discountedItems) {
      const lineId = item.line_id || item.id;
      const discount = (item.unit_price * getDiscountPercent) / 100;
      const currentDiscount = lineDiscounts.get(lineId) || 0;
      lineDiscounts.set(lineId, currentDiscount + discount);
    }

    const lineAdjustments: LineItemAdjustment[] = [];
    let totalDiscount = 0;

    for (const [lineId, discount] of lineDiscounts) {
      const item = qualifyingItems.find(i => (i.line_id || i.id) === lineId);
      if (item) {
        const maxDiscount = item.unit_price * item.quantity;
        const cappedDiscount = this.applyCaps(Math.min(discount, maxDiscount), maxDiscount);
        
        if (cappedDiscount > 0) {
          totalDiscount += cappedDiscount;
          lineAdjustments.push(this.createLineAdjustment(
            lineId,
            cappedDiscount,
            this.getBuyXGetYDisplayText(getDiscountPercent)
          ));
        }
      }
    }

    return {
      totalDiscount: this.applyRounding(totalDiscount),
      lineAdjustments,
      displayText: this.getDisplayText()
    };
  }

  private expandItems(items: CartLineItem[]): { item: CartLineItem; originalIndex: number }[] {
    const expanded: { item: CartLineItem; originalIndex: number }[] = [];
    
    items.forEach((item, index) => {
      for (let i = 0; i < item.quantity; i++) {
        expanded.push({ 
          item: { ...item, quantity: 1 },
          originalIndex: index 
        });
      }
    });
    
    return expanded;
  }

  private sortByStrategy(
    items: { item: CartLineItem; originalIndex: number }[],
    strategy: string
  ): { item: CartLineItem; originalIndex: number }[] {
    const sorted = [...items];
    
    switch (strategy) {
      case 'lowest_priced':
        sorted.sort((a, b) => a.item.unit_price - b.item.unit_price);
        break;
      case 'highest_priced':
        sorted.sort((a, b) => b.item.unit_price - a.item.unit_price);
        break;
      default:
        break;
    }
    
    return sorted;
  }

  private getBuyXGetYDisplayText(discountPercent: number): string {
    const buyQty = this.benefitConfig.buy_quantity ?? this.benefitConfig.buy_qty ?? 1;
    const getQty = this.benefitConfig.get_quantity ?? this.benefitConfig.get_qty ?? 1;
    
    if (discountPercent === 100) {
      return `Buy ${buyQty} Get ${getQty} Free`;
    }
    return `Buy ${buyQty} Get ${getQty} at ${discountPercent}% off`;
  }
}
