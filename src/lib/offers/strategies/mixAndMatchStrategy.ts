// Mix and Match strategy - combine items from different groups for a deal
import { BaseStrategy, StrategyContext, StrategyResult } from './baseStrategy';
import { CartLineItem, LineItemAdjustment, QualifyingFilters } from '../types';
import { filterQualifyingItems } from '../derivedFields';

interface ItemGroup {
  group_id: string;
  filters: QualifyingFilters;
  required_quantity: number;
}

export class MixAndMatchStrategy extends BaseStrategy {
  compute(ctx: StrategyContext): StrategyResult {
    const { cart } = ctx;
    
    const groups: ItemGroup[] = this.benefitConfig.groups || [];
    const comboPrice = this.benefitConfig.combo_price;
    const comboDiscountPercent = this.benefitConfig.combo_discount_percent;
    const comboDiscountAmount = this.benefitConfig.combo_discount_amount;
    const maxCombos = this.benefitConfig.max_combos;
    
    if (groups.length === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Find items matching each group
    const groupMatches: Map<string, CartLineItem[]> = new Map();
    
    for (const group of groups) {
      const matchingItems = filterQualifyingItems(cart.items, group.filters);
      groupMatches.set(group.group_id, matchingItems);
    }

    // Calculate how many complete combos we can form
    let availableCombos = this.calculateAvailableCombos(groups, groupMatches);
    
    if (maxCombos !== undefined) {
      availableCombos = Math.min(availableCombos, maxCombos);
    }
    
    if (availableCombos === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Select items for each combo and calculate discount
    const selectedItems = this.selectItemsForCombos(groups, groupMatches, availableCombos);
    
    // Calculate original value of selected items
    let originalValue = 0;
    for (const item of selectedItems) {
      originalValue += item.unit_price;
    }

    // Calculate discount based on benefit type
    let discount = 0;
    
    if (comboPrice !== undefined) {
      discount = originalValue - (comboPrice * availableCombos);
    } else if (comboDiscountPercent !== undefined) {
      discount = (originalValue * comboDiscountPercent) / 100;
    } else if (comboDiscountAmount !== undefined) {
      discount = comboDiscountAmount * availableCombos;
    }

    discount = Math.max(0, discount);
    
    if (discount === 0) {
      return { totalDiscount: 0, lineAdjustments: [], displayText: this.getDisplayText() };
    }

    // Distribute discount proportionally across items in combos
    const lineAdjustments: LineItemAdjustment[] = [];
    const lineDiscounts = new Map<string, number>();
    
    // Track how much each line item contributes
    const lineContributions = new Map<string, number>();
    for (const item of selectedItems) {
      const lineId = item.line_id || item.id;
      const current = lineContributions.get(lineId) || 0;
      lineContributions.set(lineId, current + item.unit_price);
    }

    // Distribute discount proportionally
    for (const [lineId, contribution] of lineContributions) {
      const proportion = contribution / originalValue;
      const lineDiscount = discount * proportion;
      lineDiscounts.set(lineId, lineDiscount);
    }

    let totalDiscount = 0;

    for (const [lineId, lineDiscount] of lineDiscounts) {
      const item = cart.items.find(i => (i.line_id || i.id) === lineId);
      if (item) {
        const maxDiscount = item.unit_price * item.quantity;
        const cappedDiscount = this.applyCaps(Math.min(lineDiscount, maxDiscount), maxDiscount);
        
        if (cappedDiscount > 0) {
          totalDiscount += cappedDiscount;
          lineAdjustments.push(this.createLineAdjustment(
            lineId,
            cappedDiscount,
            this.getComboDisplayText()
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

  private calculateAvailableCombos(
    groups: ItemGroup[],
    groupMatches: Map<string, CartLineItem[]>
  ): number {
    let minCombos = Infinity;
    
    for (const group of groups) {
      const items = groupMatches.get(group.group_id) || [];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const possibleCombos = Math.floor(totalQuantity / group.required_quantity);
      minCombos = Math.min(minCombos, possibleCombos);
    }
    
    return minCombos === Infinity ? 0 : minCombos;
  }

  private selectItemsForCombos(
    groups: ItemGroup[],
    groupMatches: Map<string, CartLineItem[]>,
    numCombos: number
  ): CartLineItem[] {
    const selected: CartLineItem[] = [];
    
    for (const group of groups) {
      const items = groupMatches.get(group.group_id) || [];
      const sortedItems = [...items].sort((a, b) => a.unit_price - b.unit_price);
      
      let remaining = group.required_quantity * numCombos;
      
      for (const item of sortedItems) {
        if (remaining <= 0) break;
        
        const take = Math.min(item.quantity, remaining);
        for (let i = 0; i < take; i++) {
          selected.push({ ...item, quantity: 1 });
        }
        remaining -= take;
      }
    }
    
    return selected;
  }

  private getComboDisplayText(): string {
    const comboPrice = this.benefitConfig.combo_price;
    const comboDiscountPercent = this.benefitConfig.combo_discount_percent;
    
    if (comboPrice !== undefined) {
      return `Combo Deal - ₹${comboPrice}`;
    }
    if (comboDiscountPercent !== undefined) {
      return `Mix & Match - ${comboDiscountPercent}% off`;
    }
    return this.getDisplayText();
  }
}
