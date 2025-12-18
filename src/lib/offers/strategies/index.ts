// Strategy factory and exports
import { Offer, OfferType } from '../types';
import { BaseStrategy } from './baseStrategy';
import { PercentDiscountStrategy } from './percentDiscountStrategy';
import { FlatDiscountStrategy } from './flatDiscountStrategy';
import { PriceOverrideStrategy } from './priceOverrideStrategy';
import { TieredDiscountStrategy } from './tieredDiscountStrategy';
import { BuyXGetYStrategy } from './buyXGetYStrategy';
import { MixAndMatchStrategy } from './mixAndMatchStrategy';
import { CheapestItemStrategy } from './cheapestItemStrategy';
import { FreeGiftStrategy } from './freeGiftStrategy';
import { CashbackStrategy } from './cashbackStrategy';
import { LoyaltyPointsStrategy } from './loyaltyPointsStrategy';

export { BaseStrategy } from './baseStrategy';
export type { StrategyContext, StrategyResult } from './baseStrategy';
export { PercentDiscountStrategy } from './percentDiscountStrategy';
export { FlatDiscountStrategy } from './flatDiscountStrategy';
export { PriceOverrideStrategy } from './priceOverrideStrategy';
export { TieredDiscountStrategy } from './tieredDiscountStrategy';
export { BuyXGetYStrategy } from './buyXGetYStrategy';
export { MixAndMatchStrategy } from './mixAndMatchStrategy';
export { CheapestItemStrategy } from './cheapestItemStrategy';
export { FreeGiftStrategy } from './freeGiftStrategy';
export { CashbackStrategy } from './cashbackStrategy';
export { LoyaltyPointsStrategy } from './loyaltyPointsStrategy';

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
    case 'cheapest_item':
      return new CheapestItemStrategy(offer);
    case 'free_gift':
      return new FreeGiftStrategy(offer);
    case 'cashback':
      return new CashbackStrategy(offer);
    case 'loyalty_points':
      return new LoyaltyPointsStrategy(offer);
    // Future strategies
    case 'free_item':
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
    'mix_and_match',
    'cheapest_item',
    'free_gift',
    'cashback',
    'loyalty_points'
  ].includes(offerType);
}
