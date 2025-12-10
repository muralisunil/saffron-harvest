-- Enable realtime for analytics tables to support real-time notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_product_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;