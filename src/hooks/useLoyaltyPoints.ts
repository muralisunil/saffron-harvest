import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RedemptionTier {
  id: string;
  points_required: number;
  discount_amount: number;
  min_purchase_amount: number;
  is_active: boolean;
}

interface LoyaltyTransaction {
  id: string;
  transaction_type: string;
  points: number;
  order_id: string | null;
  description: string;
  created_at: string;
}

interface LoyaltyData {
  balance: number;
  lifetime_points: number;
  tiers: RedemptionTier[];
  transactions: LoyaltyTransaction[];
}

export function useLoyaltyPoints(userId: string | null) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLoyaltyData = useCallback(async () => {
    if (!userId) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-loyalty-points', {
        body: { action: 'get_balance', user_id: userId }
      });

      if (error) throw error;

      setData({
        balance: response.balance,
        lifetime_points: response.lifetime_points,
        tiers: response.tiers,
        transactions: response.transactions
      });
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewards data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const redeemPoints = async (tierId: string, orderId: string) => {
    if (!userId) return null;

    try {
      const { data: response, error } = await supabase.functions.invoke('manage-loyalty-points', {
        body: { action: 'redeem', user_id: userId, tier_id: tierId, order_id: orderId }
      });

      if (error) throw error;

      if (!response.success) {
        toast({
          title: 'Redemption Failed',
          description: response.error,
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: 'Points Redeemed!',
        description: `You saved $${response.discount_amount} on this order`,
      });

      await fetchLoyaltyData();
      return response;
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeem points',
        variant: 'destructive'
      });
      return null;
    }
  };

  const getAvailableTiers = (cartTotal: number) => {
    if (!data) return [];
    return data.tiers.filter(
      tier => 
        tier.points_required <= data.balance && 
        cartTotal >= tier.min_purchase_amount
    );
  };

  const getNextTier = () => {
    if (!data) return null;
    return data.tiers.find(tier => tier.points_required > data.balance) || null;
  };

  const getPointsToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier || !data) return null;
    return nextTier.points_required - data.balance;
  };

  return {
    balance: data?.balance || 0,
    lifetimePoints: data?.lifetime_points || 0,
    tiers: data?.tiers || [],
    transactions: data?.transactions || [],
    loading,
    refetch: fetchLoyaltyData,
    redeemPoints,
    getAvailableTiers,
    getNextTier,
    getPointsToNextTier
  };
}
