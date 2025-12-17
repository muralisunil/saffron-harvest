// Strategy factory and exports
import { Offer, OfferType } from '../types';
import { BaseStrategy } from './baseStrategy';
import { PercentDiscountStrategy } from './percentDiscountStrategy';
import { FlatDiscountStrategy } from './flatDiscountStrategy';
import { PriceOverrideStrategy } from './priceOverrideStrategy';
import { TieredDiscountStrategy } from './tieredDiscountStrategy';
import { BuyXGetYStrategy } from './buyXGetYStrategy';
import { MixAndMatchStrategy } from './mixAndMatchStrategy';

export { BaseStrategy } from './baseStrategy';
export type { StrategyContext, StrategyResult } from './baseStrategy';
export { PercentDiscountStrategy } from './percentDiscountStrategy';
export { FlatDiscountStrategy } from './flatDiscountStrategy';
export { PriceOverrideStrategy } from './priceOverrideStrategy';
export { TieredDiscountStrategy } from './tieredDiscountStrategy';
export { BuyXGetYStrategy } from './buyXGetYStrategy';
export { MixAndMatchStrategy } from './mixAndMatchStrategy';

// Strategy factory
export function createStrategy(offer: Offer): BaseStrategy | null {
  const offerType = offer.offer_type;
  
  switch (offerType) {
    case 'percent_discount':
      return new PercentDiscountStrategy(offer);
    case 'flat_discount':
      return new FlatDiscountStrategy(offer);
    case 'price_override':
      return new PriceOverrideStrategy(offer);
    case 'tiered_discount':
      return new TieredDiscountStrategy(offer);
    case 'buy_x_get_y':
      return new BuyXGetYStrategy(offer);
    case 'mix_and_match':
      return new MixAndMatchStrategy(offer);
    // Future strategies
    case 'cheapest_item':
    case 'free_item':
    case 'free_gift':
    case 'cashback':
    case 'loyalty_points':
      return null;
    default:
      return null;
  }
}

// Check if a strategy is implemented
export function isStrategyImplemented(offerType: OfferType): boolean {
  return [
    'percent_discount', 
    'flat_discount', 
    'price_override',
    'tiered_discount',
    'buy_x_get_y',
    'mix_and_match'
  ].includes(offerType);
}
