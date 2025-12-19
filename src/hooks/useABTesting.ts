import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import {
  ABTestContext,
  ExperimentVariant,
  getExperimentOfferIds,
  logExposure,
  logExposures,
  logConversionsForActiveExperiments,
  ExposureLog
} from '@/lib/offers/abTesting';

const SESSION_KEY = 'ab_test_session_id';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `ab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export interface UseABTestingResult {
  isLoading: boolean;
  context: ABTestContext;
  activeOfferIds: Set<string>;
  excludedOfferIds: Set<string>;
  variantAssignments: Map<string, ExperimentVariant>;
  logOfferExposure: (offerId: string, additionalContext?: Record<string, unknown>) => Promise<void>;
  logOfferExposures: (offerIds: string[], additionalContext?: Record<string, unknown>) => Promise<void>;
  logConversionEvent: (
    conversionType: string,
    conversionValue?: number,
    orderId?: string,
    properties?: Record<string, unknown>
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useABTesting(): UseABTestingResult {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [activeOfferIds, setActiveOfferIds] = useState<Set<string>>(new Set());
  const [excludedOfferIds, setExcludedOfferIds] = useState<Set<string>>(new Set());
  const [variantAssignments, setVariantAssignments] = useState<Map<string, ExperimentVariant>>(new Map());
  const [exposureCache] = useState(() => new Set<string>());

  const context: ABTestContext = useMemo(() => ({
    user_id: userId,
    session_id: sessionId
  }), [userId, sessionId]);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getExperimentOfferIds(context);
      setActiveOfferIds(result.activeOfferIds);
      setExcludedOfferIds(result.excludedOfferIds);
      setVariantAssignments(result.assignments);
    } catch (error) {
      console.error('Error fetching AB test assignments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch assignments when context changes
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Log exposure for a single offer
  const logOfferExposure = useCallback(async (
    offerId: string,
    additionalContext?: Record<string, unknown>
  ) => {
    // Find which experiment/variant this offer belongs to
    for (const [experimentId, variant] of variantAssignments) {
      if (variant.offer_ids.includes(offerId)) {
        const cacheKey = `${experimentId}:${variant.id}:${offerId}`;
        if (exposureCache.has(cacheKey)) return; // Already logged
        
        exposureCache.add(cacheKey);
        
        await logExposure({
          experiment_id: experimentId,
          variant_id: variant.id,
          user_id: userId,
          session_id: sessionId,
          offer_id: offerId,
          context: additionalContext as Json
        });
        break;
      }
    }
  }, [variantAssignments, userId, sessionId, exposureCache]);

  // Log exposures for multiple offers
  const logOfferExposures = useCallback(async (
    offerIds: string[],
    additionalContext?: Record<string, unknown>
  ) => {
    const exposuresToLog: ExposureLog[] = [];

    for (const offerId of offerIds) {
      for (const [experimentId, variant] of variantAssignments) {
        if (variant.offer_ids.includes(offerId)) {
          const cacheKey = `${experimentId}:${variant.id}:${offerId}`;
          if (!exposureCache.has(cacheKey)) {
            exposureCache.add(cacheKey);
            exposuresToLog.push({
              experiment_id: experimentId,
              variant_id: variant.id,
              user_id: userId,
              session_id: sessionId,
              offer_id: offerId,
              context: additionalContext as Json
            });
          }
          break;
        }
      }
    }

    if (exposuresToLog.length > 0) {
      await logExposures(exposuresToLog);
    }
  }, [variantAssignments, userId, sessionId, exposureCache]);

  // Log conversion event for all active experiments
  const logConversionEvent = useCallback(async (
    conversionType: string,
    conversionValue?: number,
    orderId?: string,
    properties?: Record<string, unknown>
  ) => {
    await logConversionsForActiveExperiments(
      context,
      conversionType,
      conversionValue,
      orderId,
      properties as Json
    );
  }, [context]);

  return {
    isLoading,
    context,
    activeOfferIds,
    excludedOfferIds,
    variantAssignments,
    logOfferExposure,
    logOfferExposures,
    logConversionEvent,
    refetch: fetchAssignments
  };
}
