// Strategy factory and exports
import { Offer, OfferType } from '../types';
import { BaseStrategy } from './baseStrategy';
import { PercentDiscountStrategy } from './percentDiscountStrategy';
import { FlatDiscountStrategy } from './flatDiscountStrategy';
import { PriceOverrideStrategy } from './priceOverrideStrategy';

export { BaseStrategy } from './baseStrategy';
export type { StrategyContext, StrategyResult } from './baseStrategy';
export { PercentDiscountStrategy } from './percentDiscountStrategy';
export { FlatDiscountStrategy } from './flatDiscountStrategy';
export { PriceOverrideStrategy } from './priceOverrideStrategy';

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
    // Future strategies will be added here
    case 'tiered_discount':
    case 'buy_x_get_y':
    case 'mix_and_match':
    case 'cheapest_item':
    case 'free_item':
    case 'free_gift':
    case 'cashback':
    case 'loyalty_points':
      // Not yet implemented - return null
      return null;
    default:
      return null;
  }
}

// Check if a strategy is implemented
export function isStrategyImplemented(offerType: OfferType): boolean {
  return ['percent_discount', 'flat_discount', 'price_override'].includes(offerType);
}
