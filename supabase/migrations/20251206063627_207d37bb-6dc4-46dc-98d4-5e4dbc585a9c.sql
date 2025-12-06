-- Analytics Events Table - Core table for all telemetry events
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Page Views Table - Track page visits and time on page
CREATE TABLE public.analytics_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  time_on_page_ms INTEGER,
  scroll_depth_percent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exited_at TIMESTAMP WITH TIME ZONE
);

-- Product Analytics Table - Track product interactions
CREATE TABLE public.analytics_product_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  event_type TEXT NOT NULL, -- 'view', 'quick_view', 'add_to_cart', 'remove_from_cart', 'add_to_wishlist', 'purchase'
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2),
  source_page TEXT,
  source_section TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search Analytics Table - Track search behavior
CREATE TABLE public.analytics_search_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  results_count INTEGER,
  clicked_result_id TEXT,
  clicked_result_position INTEGER,
  search_type TEXT, -- 'autocomplete', 'full_search', 'filter'
  filters_applied JSONB DEFAULT '{}',
  time_to_click_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance Metrics Table - Track page and API performance
CREATE TABLE public.analytics_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL, -- 'page_load', 'api_call', 'interaction', 'resource'
  metric_name TEXT NOT NULL,
  duration_ms NUMERIC(10,2),
  start_time TIMESTAMP WITH TIME ZONE,
  page_path TEXT,
  resource_url TEXT,
  status_code INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics Sessions Table - Track user sessions
CREATE TABLE public.analytics_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_views_count INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  referrer TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  is_bounce BOOLEAN DEFAULT true
);

-- Enable RLS on all analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for tracking before login)
CREATE POLICY "Allow anonymous analytics inserts" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous page view inserts" ON public.analytics_page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous product event inserts" ON public.analytics_product_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous search event inserts" ON public.analytics_search_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous performance inserts" ON public.analytics_performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous session inserts" ON public.analytics_sessions FOR INSERT WITH CHECK (true);

-- Policy: Allow session updates (for updating last_activity, page_views_count, etc.)
CREATE POLICY "Allow session updates" ON public.analytics_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow page view updates" ON public.analytics_page_views FOR UPDATE USING (true);

-- Policy: Users can view their own analytics (for personal dashboards)
CREATE POLICY "Users can view own analytics" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own page views" ON public.analytics_page_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own product events" ON public.analytics_product_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own search events" ON public.analytics_search_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own performance" ON public.analytics_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON public.analytics_sessions FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_page_views_session ON public.analytics_page_views(session_id);
CREATE INDEX idx_analytics_page_views_path ON public.analytics_page_views(page_path);
CREATE INDEX idx_analytics_product_events_product ON public.analytics_product_events(product_id);
CREATE INDEX idx_analytics_product_events_type ON public.analytics_product_events(event_type);
CREATE INDEX idx_analytics_search_events_query ON public.analytics_search_events(query);
CREATE INDEX idx_analytics_performance_type ON public.analytics_performance(metric_type);