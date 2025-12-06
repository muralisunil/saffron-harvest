import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Session management
const SESSION_KEY = 'desi-pantry-analytics-session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  id: string;
  startedAt: number;
  lastActivity: number;
}

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Get or create session
const getOrCreateSession = (): SessionData => {
  const stored = localStorage.getItem(SESSION_KEY);
  const now = Date.now();
  
  if (stored) {
    const session: SessionData = JSON.parse(stored);
    // Check if session is still valid (not timed out)
    if (now - session.lastActivity < SESSION_TIMEOUT) {
      session.lastActivity = now;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }
  }
  
  // Create new session
  const newSession: SessionData = {
    id: generateSessionId(),
    startedAt: now,
    lastActivity: now
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession;
};

// Device detection utilities
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
};

const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

// Parse UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign')
  };
};

// Types for analytics events
export interface ProductEventData {
  productId: string;
  variantId?: string;
  eventType: 'view' | 'quick_view' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'purchase';
  quantity?: number;
  price?: number;
  sourcePage?: string;
  sourceSection?: string;
  properties?: Record<string, unknown>;
}

export interface SearchEventData {
  query: string;
  resultsCount?: number;
  clickedResultId?: string;
  clickedResultPosition?: number;
  searchType?: 'autocomplete' | 'full_search' | 'filter';
  filtersApplied?: Record<string, unknown>;
  timeToClickMs?: number;
}

export interface PerformanceEventData {
  metricType: 'page_load' | 'api_call' | 'interaction' | 'resource';
  metricName: string;
  durationMs: number;
  startTime?: Date;
  pagePath?: string;
  resourceUrl?: string;
  statusCode?: number;
  properties?: Record<string, unknown>;
}

export interface GenericEventData {
  eventType: string;
  eventName: string;
  properties?: Record<string, unknown>;
}

// Analytics hook
export const useAnalytics = () => {
  const location = useLocation();
  const sessionRef = useRef<SessionData>(getOrCreateSession());
  const pageViewIdRef = useRef<string | null>(null);
  const pageLoadTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);

  // Get current user ID (may be null for anonymous users)
  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  // Initialize or update session in database
  const initSession = useCallback(async () => {
    const session = sessionRef.current;
    const userId = await getUserId();
    const utmParams = getUTMParams();

    try {
      await supabase.from('analytics_sessions' as never).upsert({
        id: session.id,
        user_id: userId,
        started_at: new Date(session.startedAt).toISOString(),
        last_activity_at: new Date().toISOString(),
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        referrer: document.referrer || null,
        landing_page: window.location.pathname,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign
      } as never, { onConflict: 'id' });
    } catch (error) {
      console.error('[Analytics] Failed to init session:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (path: string, title?: string) => {
    const session = sessionRef.current;
    const userId = await getUserId();
    pageLoadTimeRef.current = Date.now();
    scrollDepthRef.current = 0;

    try {
      const { data } = await supabase.from('analytics_page_views' as never).insert({
        session_id: session.id,
        user_id: userId,
        page_path: path,
        page_title: title || document.title,
        referrer: document.referrer || null
      } as never).select('id').single();

      if (data) {
        pageViewIdRef.current = (data as { id: string }).id;
      }

      // Update session
      await supabase.from('analytics_sessions' as never).update({
        last_activity_at: new Date().toISOString(),
        page_views_count: 1,
        is_bounce: false
      } as never).eq('id', session.id);

    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }, []);

  // Update page view with exit data
  const updatePageViewExit = useCallback(async () => {
    if (!pageViewIdRef.current) return;

    const timeOnPage = Date.now() - pageLoadTimeRef.current;
    
    try {
      await supabase.from('analytics_page_views' as never).update({
        time_on_page_ms: timeOnPage,
        scroll_depth_percent: scrollDepthRef.current,
        exited_at: new Date().toISOString()
      } as never).eq('id', pageViewIdRef.current);
    } catch (error) {
      console.error('[Analytics] Failed to update page view exit:', error);
    }
  }, []);

  // Track generic event
  const trackEvent = useCallback(async (data: GenericEventData) => {
    const session = sessionRef.current;
    const userId = await getUserId();

    try {
      await supabase.from('analytics_events' as never).insert({
        session_id: session.id,
        user_id: userId,
        event_type: data.eventType,
        event_name: data.eventName,
        page_path: location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        properties: data.properties || {}
      } as never);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }, [location.pathname]);

  // Track product event
  const trackProductEvent = useCallback(async (data: ProductEventData) => {
    const session = sessionRef.current;
    const userId = await getUserId();

    try {
      await supabase.from('analytics_product_events' as never).insert({
        session_id: session.id,
        user_id: userId,
        product_id: data.productId,
        variant_id: data.variantId || null,
        event_type: data.eventType,
        quantity: data.quantity || 1,
        price: data.price || null,
        source_page: data.sourcePage || location.pathname,
        source_section: data.sourceSection || null,
        properties: data.properties || {}
      } as never);
    } catch (error) {
      console.error('[Analytics] Failed to track product event:', error);
    }
  }, [location.pathname]);

  // Track search event
  const trackSearchEvent = useCallback(async (data: SearchEventData) => {
    const session = sessionRef.current;
    const userId = await getUserId();

    try {
      await supabase.from('analytics_search_events' as never).insert({
        session_id: session.id,
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
  }, []);

  // Track performance metric
  const trackPerformance = useCallback(async (data: PerformanceEventData) => {
    const session = sessionRef.current;
    const userId = await getUserId();

    try {
      await supabase.from('analytics_performance' as never).insert({
        session_id: session.id,
        user_id: userId,
        metric_type: data.metricType,
        metric_name: data.metricName,
        duration_ms: data.durationMs,
        start_time: data.startTime?.toISOString() || null,
        page_path: data.pagePath || location.pathname,
        resource_url: data.resourceUrl || null,
        status_code: data.statusCode ?? null,
        properties: data.properties || {}
      } as never);
    } catch (error) {
      console.error('[Analytics] Failed to track performance:', error);
    }
  }, [location.pathname]);

  // Track scroll depth
  const updateScrollDepth = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      const currentDepth = Math.round((window.scrollY / scrollHeight) * 100);
      if (currentDepth > scrollDepthRef.current) {
        scrollDepthRef.current = currentDepth;
      }
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Track page views on route change
  useEffect(() => {
    // Update previous page view exit data
    updatePageViewExit();
    // Track new page view
    trackPageView(location.pathname);

    // Track scroll depth
    const handleScroll = () => updateScrollDepth();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, trackPageView, updatePageViewExit, updateScrollDepth]);

  // Track page exit on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      updatePageViewExit();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updatePageViewExit]);

  // Track Web Vitals performance metrics
  useEffect(() => {
    const trackWebVitals = async () => {
      // Track initial page load
      if (window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          await trackPerformance({
            metricType: 'page_load',
            metricName: 'dom_content_loaded',
            durationMs: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            pagePath: location.pathname
          });
          await trackPerformance({
            metricType: 'page_load',
            metricName: 'full_page_load',
            durationMs: navigation.loadEventEnd - navigation.fetchStart,
            pagePath: location.pathname
          });
        }
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      trackWebVitals();
    } else {
      window.addEventListener('load', trackWebVitals);
      return () => window.removeEventListener('load', trackWebVitals);
    }
  }, [location.pathname, trackPerformance]);

  return {
    trackEvent,
    trackProductEvent,
    trackSearchEvent,
    trackPerformance,
    sessionId: sessionRef.current.id
  };
};
