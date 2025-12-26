import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Gift, Star, Trophy, TrendingUp, Clock, CheckCircle2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLoyaltyPoints } from "@/hooks/useLoyaltyPoints";
import { format } from "date-fns";

const Rewards = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { balance, lifetimePoints, tiers, transactions, loading, getNextTier, getPointsToNextTier } = useLoyaltyPoints(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const nextTier = getNextTier();
  const pointsToNext = getPointsToNextTier();
  const progressPercent = nextTier ? Math.min((balance / nextTier.points_required) * 100, 100) : 100;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'redeem':
        return <Gift className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center py-16">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Join Our Rewards Program</h1>
            <p className="text-muted-foreground mb-4">
              Sign in to start earning points and unlock exclusive rewards!
            </p>
            <p className="text-sm text-muted-foreground">
              Earn 1 point for every $1 spent. Redeem points for discounts on future purchases.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Rewards</h1>
          <p className="text-muted-foreground">Track your points and redeem rewards</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Points Overview */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Points</p>
                      <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary">
                      <Trophy className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lifetime Points</p>
                      <p className="text-3xl font-bold">{lifetimePoints.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  {nextTier ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Next Reward</p>
                        <Badge variant="secondary">${nextTier.discount_amount} off</Badge>
                      </div>
                      <Progress value={progressPercent} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{pointsToNext}</span> points to go
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">All tiers unlocked!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Redemption Tiers */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Available Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {tiers.map((tier) => {
                    const isUnlocked = balance >= tier.points_required;
                    return (
                      <div
                        key={tier.id}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isUnlocked
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/30"
                        }`}
                      >
                        {isUnlocked && (
                          <Badge className="absolute -top-2 -right-2 bg-primary">
                            Unlocked
                          </Badge>
                        )}
                        <div className="text-center">
                          <div className={`text-3xl font-bold mb-1 ${isUnlocked ? "text-primary" : "text-muted-foreground"}`}>
                            ${tier.discount_amount}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">off your order</p>
                          <Separator className="my-3" />
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">
                              {tier.points_required} points
                            </p>
                            <p>Min. purchase: ${tier.min_purchase_amount}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Points History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Points History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Start shopping to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.transaction_type)}
                          <div>
                            <p className="font-medium">{tx.description || tx.transaction_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          tx.transaction_type === 'earn' ? 'text-emerald-600' : 'text-primary'
                        }`}>
                          {tx.transaction_type === 'earn' ? '+' : '-'}{Math.abs(tx.points)} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Rewards;
