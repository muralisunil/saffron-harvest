// Base strategy interface for offer application
import { 
  Offer, 
  Cart, 
  CartLineItem, 
  ApplicationPlan, 
  LineItemAdjustment,
  BenefitConfig,
  CapsConfig,
  DerivedFields 
} from '../types';

export interface StrategyContext {
  offer: Offer;
  cart: Cart;
  qualifyingItems: CartLineItem[];
  derivedFields: DerivedFields;
}

export interface StrategyResult {
  totalDiscount: number;
  lineAdjustments: LineItemAdjustment[];
  displayText: string;
}

export abstract class BaseStrategy {
  protected offer: Offer;
  protected benefitConfig: BenefitConfig;
  protected capsConfig: CapsConfig;

  constructor(offer: Offer) {
    this.offer = offer;
    this.benefitConfig = offer.current_version?.benefit_config || {};
    this.capsConfig = offer.current_version?.caps_config || {
      rounding: 'half_up',
      apply_pre_tax: true,
      apply_to_fees: false
    };
  }

  abstract compute(ctx: StrategyContext): StrategyResult;

  protected applyRounding(amount: number): number {
    const { rounding } = this.capsConfig;
    switch (rounding) {
      case 'floor':
        return Math.floor(amount * 100) / 100;
      case 'ceil':
        return Math.ceil(amount * 100) / 100;
      case 'half_up':
      default:
        return Math.round(amount * 100) / 100;
    }
  }

  protected applyCaps(discount: number, originalPrice: number): number {
    let result = discount;
    
    // Apply max discount cap
    if (this.capsConfig.max_discount_amount !== undefined && this.capsConfig.max_discount_amount !== null) {
      result = Math.min(result, this.capsConfig.max_discount_amount);
    }
    
    // Apply min price floor
    if (this.capsConfig.min_price_floor !== undefined && this.capsConfig.min_price_floor !== null) {
      const maxAllowedDiscount = originalPrice - this.capsConfig.min_price_floor;
      result = Math.min(result, Math.max(0, maxAllowedDiscount));
    }
    
    return this.applyRounding(result);
  }

  protected createLineAdjustment(
    lineId: string,
    amount: number,
    displayText?: string
  ): LineItemAdjustment {
    return {
      line_id: lineId,
      offer_id: this.offer.id,
      amount: this.applyRounding(amount),
      display_text: displayText || this.offer.marketing_text || this.offer.name
    };
  }

  protected getDisplayText(): string {
    return this.offer.marketing_text || this.offer.name;
  }
}
