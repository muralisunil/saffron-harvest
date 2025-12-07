-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow anonymous analytics inserts" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow anonymous page view inserts" ON public.analytics_page_views;
DROP POLICY IF EXISTS "Allow page view updates" ON public.analytics_page_views;
DROP POLICY IF EXISTS "Allow anonymous performance inserts" ON public.analytics_performance;
DROP POLICY IF EXISTS "Allow anonymous product event inserts" ON public.analytics_product_events;
DROP POLICY IF EXISTS "Allow anonymous search event inserts" ON public.analytics_search_events;
DROP POLICY IF EXISTS "Allow anonymous session inserts" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON public.analytics_sessions;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Allow anonymous analytics inserts" 
ON public.analytics_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous page view inserts" 
ON public.analytics_page_views 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow page view updates" 
ON public.analytics_page_views 
FOR UPDATE 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous performance inserts" 
ON public.analytics_performance 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous product event inserts" 
ON public.analytics_product_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous search event inserts" 
ON public.analytics_search_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous session inserts" 
ON public.analytics_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow session updates" 
ON public.analytics_sessions 
FOR UPDATE 
TO anon, authenticated
USING (true);

-- Add SELECT policies for anonymous users to enable the analytics dashboard to read data
CREATE POLICY "Allow anonymous analytics reads" 
ON public.analytics_events 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous page view reads" 
ON public.analytics_page_views 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous performance reads" 
ON public.analytics_performance 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous product event reads" 
ON public.analytics_product_events 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous search event reads" 
ON public.analytics_search_events 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous session reads" 
ON public.analytics_sessions 
FOR SELECT 
TO anon, authenticated
USING (true);