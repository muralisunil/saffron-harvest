import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types/product';

const SESSION_KEY = 'analytics_session_id';

const getSessionId = (): string | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      return parsed.id || null;
    }
  } catch {
    return null;
  }
  return null;
};

export const useCartSession = (items: CartItem[], cartTotal: number) => {
  const cartSessionId = useRef<string | null>(null);
  const checkoutStartedAt = useRef<Date | null>(null);

  // Create or update cart session
  const syncCartSession = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId || items.length === 0) return;

    const { data: user } = await supabase.auth.getUser();
    
    const cartItems = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      variantId: item.variant.id,
      variantSize: item.variant.size,
      quantity: item.quantity,
      price: item.variant.price,
    }));

    try {
      // Check if cart session exists
      const { data: existing } = await supabase
        .from('cart_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .eq('checkout_completed', false)
        .maybeSingle();

      if (existing) {
        // Update existing session
        cartSessionId.current = existing.id;
        await supabase
          .from('cart_sessions')
          .update({
            cart_items: cartItems,
            cart_total: cartTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('cart_sessions')
          .insert({
            session_id: sessionId,
            user_id: user?.user?.id || null,
            cart_items: cartItems,
            cart_total: cartTotal,
          })
          .select('id')
          .single();
        
        if (newSession) {
          cartSessionId.current = newSession.id;
        }
      }
    } catch (error) {
      console.error('Error syncing cart session:', error);
    }
  }, [items, cartTotal]);

  // Mark checkout as started
  const markCheckoutStarted = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    checkoutStartedAt.current = new Date();

    try {
      await supabase
        .from('cart_sessions')
        .update({
          checkout_started: true,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('checkout_completed', false);
    } catch (error) {
      console.error('Error marking checkout started:', error);
    }
  }, []);

  // Mark checkout as abandoned
  const markCheckoutAbandoned = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await supabase
        .from('cart_sessions')
        .update({
          abandoned: true,
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('checkout_started', true)
        .eq('checkout_completed', false);
    } catch (error) {
      console.error('Error marking checkout abandoned:', error);
    }
  }, []);

  // Mark checkout as completed
  const markCheckoutCompleted = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await supabase
        .from('cart_sessions')
        .update({
          checkout_completed: true,
          abandoned: false,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('checkout_started', true);
    } catch (error) {
      console.error('Error marking checkout completed:', error);
    }
  }, []);

  return {
    syncCartSession,
    markCheckoutStarted,
    markCheckoutAbandoned,
    markCheckoutCompleted,
  };
};
