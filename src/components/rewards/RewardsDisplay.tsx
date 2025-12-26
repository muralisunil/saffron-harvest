import { Gift, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';

interface RewardsDisplayProps {
  userId: string | null;
}

export function RewardsDisplay({ userId }: RewardsDisplayProps) {
  const { balance, lifetimePoints, tiers, transactions, loading, getNextTier, getPointsToNextTier } = useLoyaltyPoints(userId);

  if (!userId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sign in to start earning rewards points!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextTier = getNextTier();
  const pointsToNext = getPointsToNextTier();
  const progressToNext = nextTier ? ((balance % nextTier.points_required) / nextTier.points_required) * 100 : 100;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-primary" />
            My Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-primary">{balance}</span>
            <span className="text-muted-foreground">points</span>
          </div>

          {nextTier && pointsToNext !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next reward: ${nextTier.discount_amount} off</span>
                <span className="font-medium">{pointsToNext} pts away</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Lifetime points: {lifetimePoints}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Redemption Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tiers.map((tier) => {
              const canRedeem = balance >= tier.points_required;
              return (
                <div
                  key={tier.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    canRedeem ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tier.points_required} pts</span>
                      {canRedeem && (
                        <Badge variant="secondary" className="text-xs">Available</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Min. ${tier.min_purchase_amount} purchase
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${canRedeem ? 'text-primary' : 'text-muted-foreground'}`}>
                      ${tier.discount_amount}
                    </span>
                    <p className="text-xs text-muted-foreground">off</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-medium ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
