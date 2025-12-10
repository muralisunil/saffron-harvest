import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, UserPlus, CreditCard, X, Bell, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'purchase' | 'signup' | 'add_to_cart' | 'high_value_view';
  message: string;
  timestamp: Date;
  value?: number;
  metadata?: Record<string, unknown>;
}

interface RealtimeNotificationsProps {
  className?: string;
}

export const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [stats, setStats] = useState({
    totalToday: 0,
    purchasesToday: 0,
    signupsToday: 0,
    revenueToday: 0,
  });

  // Play notification sound
  const playSound = () => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1bWVtdYGNkZGRjYGBgYGNjY2RkZGRkY2NjY2NjYmJiYmJiYWFhYWFhYWFhYWFiYmJiYmNjY2RkZGVlZWVlZWVkZGRjY2NiYmJhYWFgYGBfX19fX19fX19fXl5eXl5eXl5eXV1dXV1dXV5eXl5eXl5fX19fX19fYGBgYGBgYWFhYWFhYmJiYmJiY2NjY2NjZGRkZGRkZGRkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxdXV1dXV1dXV1eXl5eXl5fX19fX19gYGBgYGBhYWFhYWFiYmJiYmJjY2NjY2NjY2NjY2NjY2NjY2NjY2JiYmJiYWFhYWFgYGBgX19fXl5eXV1dXFxcW1tbW1tbW1tbW1tbW1tbW1tbXFxcXFxcXV1dXV1dXl5eXl5eX19fX19fYGBgYGBgYWFhYWFhYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJhYWFhYWFgYGBgYF9fX19eXl5dXV1cXFxbW1taWlpaWlpaWlpaWlpaWlpaWltbW1tbW1xcXFxcXV1dXV1dXl5eXl5eX19fX19fYGBgYGBgYWFhYWFhYWFhYWFhYWFhYWFhYWFhYGBgYGBgX19fX19eXl5eXl1dXVxcXFtbW1paWllZWVlZWVlZWVlZWVlZWVpaWlpaWltbW1tbXFxcXFxdXV1dXV5eXl5eXl9fX19fX2BgYGBgYGBgYGBgYGBgYGBgYGBgYF9fX19fXl5eXl5dXV1cXFxbW1taWlpZWVlYWFhYWFhYWFhYWFhYWFlZWVlZWlpaWlpbW1tbW1xcXFxcXV1dXV1dXl5eXl5eX19fX19fX19fX19fX19fX19fX19fXl5eXl5dXV1dXVxcXFtbW1paWllZWVhYWFdXV1dXV1dXV1dXV1hYWFhYWFlZWVlZWlpaWlpbW1tbW1xcXFxcXV1dXV1dXl5eXl5eXl5eXl5eXl5eXl5eXl5eXV1dXV1cXFxcW1tbWlpaWVlZWFhYV1dXVlZWVlZWVlZWVlZWV1dXV1dXWFhYWFhZWVlZWVpaWlpaW1tbW1tbXFxcXFxdXV1dXV1dXV1dXV1dXV1dXV1dXV1dXFxcXFxbW1tbWlpaWVlZWFhYV1dXVlZWVVVVVVVVVVVVVVVVVlZWVlZWV1dXV1dYWFhYWFlZWVlZWlpaWlpbW1tbW1tcXFxcXFxcXFxcXFxcXFxcXFxcXFtbW1tbWlpaWlpZWVlYWFhXV1dWVlZVVVVUVFRUVFRUVFRUVFRVVVVVVVZWVlZWV1dXV1dYWFhYWFlZWVlZWlpaWlpaW1tbW1tbW1tbW1tbW1tbW1tbW1tbWlpaWlpZWVlZWFhYV1dXVlZWVVVVVFRUU1NTU1NTU1NTU1NUVFRUVFVVVVVVVlZWVlZXV1dXV1hYWFhYWVlZWVlZWlpaWlpaWlpaWlpaWlpaWlpaWlpaWVlZWVlYWFhYV1dXVlZWVVVVVFRUU1NTUlJSUlJSUlJSUlJTU1NTU1RUVFRUVVVVVVVWVlZWVldXV1dXWFhYWFhZWVlZWVlZWVlZWVlZWVlZWVlZWVhYWFhYV1dXV1ZWVlVVVVRUVFNTU1JSUlFRUVFRUVFRUVFRUlJSUlJTU1NTU1RUVFRUVVVVVVVWVlZWVldXV1dXWFhYWFhYWFhYWFhYWFhYWFhYWFhXV1dXV1ZWVlZVVVVUVFRTU1NSUlJRUVFQUFBQUFBQUFBQUFFRUVFRUlJSUlJTU1NTU1RUVFRUVVVVVVVWVlZWVlZXV1dXV1dXV1dXV1dXV1dXV1dXV1ZWVlZWVVVVVVRUVFNTU1JSUlFRUVBQUE9PT09PT09PT09QUFBQUFFRUVRUU1NTVFRUV1dXVlZWV1dXWFhYWFhYWFhYWFhYWFhYWFhYWFhXV1dXV1ZWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5OTk5OTk9PT09QUFBQUFFRUVRUU1NTVFRUV1dXVlZWV1dXWFhYWFhYWFhYWFhYWFhYWFhYWFhXV1dXV1ZWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1NTU1OTk5OT09PUFBQUFFRUVRUU1NTVFRUV1dXVlZWV1dXWFhYWA==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    playSound();

    // Update stats
    setStats(prev => ({
      ...prev,
      totalToday: prev.totalToday + 1,
      purchasesToday: notification.type === 'purchase' ? prev.purchasesToday + 1 : prev.purchasesToday,
      signupsToday: notification.type === 'signup' ? prev.signupsToday + 1 : prev.signupsToday,
      revenueToday: notification.type === 'purchase' && notification.value 
        ? prev.revenueToday + notification.value 
        : prev.revenueToday,
    }));

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 10000);
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Subscribe to realtime product events
  useEffect(() => {
    if (!isEnabled) return;

    // Subscribe to product events for purchases and add to cart
    const productChannel = supabase
      .channel('realtime-product-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_product_events',
        },
        (payload) => {
          const event = payload.new as {
            event_type: string;
            product_id: string;
            price?: number;
            quantity?: number;
            source_page?: string;
          };

          if (event.event_type === 'purchase') {
            const value = (event.price || 0) * (event.quantity || 1);
            addNotification({
              type: 'purchase',
              message: `New purchase: ${event.product_id.substring(0, 20)}...`,
              value,
              metadata: { productId: event.product_id, quantity: event.quantity },
            });
          } else if (event.event_type === 'add_to_cart') {
            addNotification({
              type: 'add_to_cart',
              message: `Item added to cart from ${event.source_page || 'unknown page'}`,
              metadata: { productId: event.product_id },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new sessions (potential signups)
    const sessionChannel = supabase
      .channel('realtime-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_sessions',
        },
        (payload) => {
          const session = payload.new as {
            user_id?: string;
            landing_page?: string;
            referrer?: string;
            device_type?: string;
          };

          // Only notify for authenticated users (signups)
          if (session.user_id) {
            addNotification({
              type: 'signup',
              message: `New user signup from ${session.referrer || 'direct'}`,
              metadata: { 
                landingPage: session.landing_page,
                device: session.device_type,
              },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to analytics events for generic tracking
    const eventsChannel = supabase
      .channel('realtime-analytics-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          const event = payload.new as {
            event_type: string;
            event_name: string;
            properties?: Record<string, unknown>;
          };

          // Track checkout completions
          if (event.event_name === 'checkout_complete' || event.event_name === 'order_placed') {
            addNotification({
              type: 'purchase',
              message: 'Checkout completed successfully!',
              metadata: event.properties,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [isEnabled, soundEnabled]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4" />;
      case 'signup':
        return <UserPlus className="h-4 w-4" />;
      case 'add_to_cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'high_value_view':
        return <Star className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'purchase':
        return 'bg-secondary/20 border-secondary text-secondary';
      case 'signup':
        return 'bg-primary/20 border-primary text-primary';
      case 'add_to_cart':
        return 'bg-accent/20 border-accent text-accent-foreground';
      case 'high_value_view':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-600';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Real-Time Notifications</h3>
          <Badge variant="outline" className="text-xs">
            {notifications.length} active
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="sound-enabled"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              className="scale-75"
            />
            <Label htmlFor="sound-enabled" className="text-xs text-muted-foreground cursor-pointer">
              Sound
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="notifications-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="notifications-enabled" className="text-sm cursor-pointer">
              {isEnabled ? 'Live' : 'Paused'}
            </Label>
          </div>
        </div>
      </div>

      {/* Today's Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{stats.totalToday}</div>
          <div className="text-xs text-muted-foreground">Events</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-secondary">{stats.purchasesToday}</div>
          <div className="text-xs text-muted-foreground">Purchases</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-foreground">{stats.signupsToday}</div>
          <div className="text-xs text-muted-foreground">Signups</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">${stats.revenueToday.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Revenue</div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for user activity...</p>
              <p className="text-xs">Purchases, signups, and cart actions will appear here</p>
            </motion.div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  getNotificationColor(notification.type)
                )}
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notification.message}</p>
                  <p className="text-xs opacity-70">
                    {formatTimeAgo(notification.timestamp)}
                    {notification.value && ` • $${notification.value.toFixed(2)}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
