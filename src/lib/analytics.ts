// Standalone analytics utilities that don't require React Router context
// Used for tracking events from contexts that are outside the Router

import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'desi-pantry-analytics-session';

interface SessionData {
  id: string;
  startedAt: number;
  lastActivity: number;
}

// Get current session ID
const getSessionId = (): string => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    const session: SessionData = JSON.parse(stored);
    return session.id;
  }
  return 'unknown';
};

// Get current user ID
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Product event tracking without React context
export const trackProductEventDirect = async (data: {
  productId: string;
  variantId?: string;
  eventType: 'view' | 'quick_view' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'purchase';
  quantity?: number;
  price?: number;
  sourcePage?: string;
  sourceSection?: string;
  properties?: Record<string, unknown>;
}) => {
  const sessionId = getSessionId();
  const userId = await getUserId();

  try {
    await supabase.from('analytics_product_events' as never).insert({
      session_id: sessionId,
      user_id: userId,
      product_id: data.productId,
      variant_id: data.variantId || null,
      event_type: data.eventType,
      quantity: data.quantity || 1,
      price: data.price || null,
      source_page: data.sourcePage || window.location.pathname,
      source_section: data.sourceSection || null,
      properties: data.properties || {}
    } as never);
  } catch (error) {
    console.error('[Analytics] Failed to track product event:', error);
  }
};

// Generic event tracking without React context
export const trackEventDirect = async (data: {
  eventType: string;
  eventName: string;
  properties?: Record<string, unknown>;
}) => {
  const sessionId = getSessionId();
  const userId = await getUserId();

  try {
    await supabase.from('analytics_events' as never).insert({
      session_id: sessionId,
      user_id: userId,
      event_type: data.eventType,
      event_name: data.eventName,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      properties: data.properties || {}
    } as never);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

// Search event tracking without React context
export const trackSearchEventDirect = async (data: {
  query: string;
  resultsCount?: number;
  clickedResultId?: string;
  clickedResultPosition?: number;
  searchType?: 'autocomplete' | 'full_search' | 'filter';
  filtersApplied?: Record<string, unknown>;
  timeToClickMs?: number;
}) => {
  const sessionId = getSessionId();
  const userId = await getUserId();

  try {
    await supabase.from('analytics_search_events' as never).insert({
      session_id: sessionId,
      user_id: userId,
      query: data.query,
      results_count: data.resultsCount ?? null,
      clicked_result_id: data.clickedResultId || null,
      clicked_result_position: data.clickedResultPosition ?? null,
      search_type: data.searchType || null,
      filters_applied: data.filtersApplied || {},
      time_to_click_ms: data.timeToClickMs ?? null
    } as never);
  } catch (error) {
    console.error('[Analytics] Failed to track search event:', error);
  }
};
