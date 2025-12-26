import { useState } from 'react';
import { Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';

interface RewardsRedemptionProps {
  userId: string | null;
  cartSubtotal: number;
  onRedeem: (discount: number, tierId: string) => void;
  selectedTierId?: string | null;
}

export function RewardsRedemption({ userId, cartSubtotal, onRedeem, selectedTierId }: RewardsRedemptionProps) {
  const { balance, loading, getAvailableTiers, getPointsToNextTier, getNextTier } = useLoyaltyPoints(userId);
  const [selectedTier, setSelectedTier] = useState<string | null>(selectedTierId || null);

  if (!userId || loading) return null;

  const availableTiers = getAvailableTiers(cartSubtotal);
  const pointsToNext = getPointsToNextTier();
  const nextTier = getNextTier();

  if (balance === 0 && availableTiers.length === 0) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary/50" />
            <div>
              <p className="font-medium">Start earning rewards!</p>
              <p className="text-sm text-muted-foreground">
                Earn 1 point for every $1 spent
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSelectTier = (tierId: string) => {
    const tier = availableTiers.find(t => t.id === tierId);
    if (tier) {
      setSelectedTier(tierId);
      onRedeem(tier.discount_amount, tierId);
    }
  };

  const handleRemoveRedemption = () => {
    setSelectedTier(null);
    onRedeem(0, '');
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5 text-primary" />
          Rewards Points
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {balance} pts available
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableTiers.length > 0 ? (
          <>
            <RadioGroup value={selectedTier || ''} onValueChange={handleSelectTier}>
              {availableTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedTier === tier.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={tier.id} id={tier.id} />
                  <Label htmlFor={tier.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Use {tier.points_required} points</span>
                        <p className="text-xs text-muted-foreground">
                          Min. ${tier.min_purchase_amount} purchase
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        -${tier.discount_amount}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedTier && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveRedemption}
                className="w-full"
              >
                Remove reward
              </Button>
            )}
          </>
        ) : balance > 0 ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              {pointsToNext !== null && nextTier ? (
                <>
                  Earn {pointsToNext} more points to unlock ${nextTier.discount_amount} off!
                </>
              ) : cartSubtotal < (nextTier?.min_purchase_amount || 0) ? (
                <>
                  Add more items to meet the minimum purchase requirement
                </>
              ) : (
                <>Keep shopping to earn more points!</>
              )}
            </p>
          </div>
        ) : null}

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Earn 1 point for every $1 spent on this order
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
