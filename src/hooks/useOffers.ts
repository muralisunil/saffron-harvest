// Hook for integrating offers with cart
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { 
  convertCartToOfferCart, 
  evaluateOffersForCart, 
  evaluateOffersSync,
  fetchActiveOffers,
  calculateTotalDiscount 
} from '@/lib/offers/offerEvaluator';
import { 
  Offer, 
  Cart, 
  User, 
  EvaluationContext, 
  EvaluationResult,
  ApplicationPlan 
} from '@/lib/offers/types';

interface UseOffersOptions {
  user?: User | null;
  autoEvaluate?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseOffersReturn {
  // State
  offers: Offer[];
  evaluationResult: EvaluationResult | null;
  isLoading: boolean;
  error: Error | null;
  
  // Computed values
  totalDiscount: number;
  discountedSubtotal: number;
  applicablePlans: ApplicationPlan[];
  potentialSavings: Array<{ offer: Offer; missing: string[] }>;
  
  // Actions
  refreshOffers: () => Promise<void>;
  evaluateCart: () => Promise<EvaluationResult>;
}

export function useOffers(options: UseOffersOptions = {}): UseOffersReturn {
  const { user = null, autoEvaluate = true, refreshInterval } = options;
  const { items, getCartTotal } = useCart();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Convert cart items to offer cart format
  const offerCart = useMemo(() => {
    if (items.length === 0) return null;
    return convertCartToOfferCart(items);
  }, [items]);

  // Create evaluation context
  const context: EvaluationContext = useMemo(() => ({
    current_time: new Date(),
    channel: 'web'
  }), []);

  // Fetch active offers
  const refreshOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activeOffers = await fetchActiveOffers();
      setOffers(activeOffers);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch offers'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Evaluate cart against offers
  const evaluateCart = useCallback(async (): Promise<EvaluationResult> => {
    if (!offerCart || offerCart.items.length === 0) {
      const emptyResult: EvaluationResult = {
        applicable_offers: [],
        plans: [],
        messages: [],
        potential_offers: []
      };
      setEvaluationResult(emptyResult);
      return emptyResult;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // If we already have offers loaded, use sync evaluation
      let result: EvaluationResult;
      if (offers.length > 0) {
        result = evaluateOffersSync(offers, offerCart, user, context);
      } else {
        result = await evaluateOffersForCart(offerCart, user, context);
      }
      
      setEvaluationResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to evaluate offers');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [offerCart, offers, user, context]);

  // Initial load of offers
  useEffect(() => {
    refreshOffers();
  }, [refreshOffers]);

  // Auto-evaluate when cart or offers change
  useEffect(() => {
    if (autoEvaluate && offers.length > 0 && offerCart) {
      evaluateCart();
    }
  }, [autoEvaluate, offers, offerCart, evaluateCart]);

  // Optional refresh interval
  useEffect(() => {
    if (!refreshInterval) return;
    
    const interval = setInterval(refreshOffers, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refreshOffers]);

  // Computed values
  const totalDiscount = useMemo(() => {
    if (!evaluationResult) return 0;
    return calculateTotalDiscount(evaluationResult.plans);
  }, [evaluationResult]);

  const discountedSubtotal = useMemo(() => {
    const subtotal = getCartTotal();
    return Math.max(0, subtotal - totalDiscount);
  }, [getCartTotal, totalDiscount]);

  const applicablePlans = useMemo(() => {
    return evaluationResult?.plans || [];
  }, [evaluationResult]);

  const potentialSavings = useMemo(() => {
    return (evaluationResult?.potential_offers || []).map(po => ({
      offer: po.offer,
      missing: po.missing_conditions
    }));
  }, [evaluationResult]);

  return {
    offers,
    evaluationResult,
    isLoading,
    error,
    totalDiscount,
    discountedSubtotal,
    applicablePlans,
    potentialSavings,
    refreshOffers,
    evaluateCart
  };
}

// Simplified hook for just getting applicable discounts
export function useCartDiscounts() {
  const { totalDiscount, discountedSubtotal, applicablePlans, isLoading } = useOffers();
  
  return {
    totalDiscount,
    discountedSubtotal,
    discounts: applicablePlans,
    isLoading
  };
}
