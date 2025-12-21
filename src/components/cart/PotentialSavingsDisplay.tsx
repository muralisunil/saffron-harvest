import { TrendingUp, ArrowRight, ShoppingCart, Package, Tag, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import type { Offer, BenefitConfig } from "@/lib/offers/types";

interface PotentialSaving {
  offer: Offer;
  missing: string[];
}

interface PotentialSavingsDisplayProps {
  potentialSavings: PotentialSaving[];
  isLoading?: boolean;
}

interface ParsedRequirement {
  type: 'cart_value' | 'quantity' | 'category' | 'brand' | 'other';
  action: string;
  linkTo?: string;
  linkParams?: Record<string, string>;
}

// Estimate potential savings based on offer type and current cart
const estimateSavings = (offer: Offer, cartTotal: number, itemCount: number): { amount: number; display: string } | null => {
  const version = offer.current_version;
  if (!version) return null;
  
  const benefit = version.benefit_config as BenefitConfig;
  
  switch (offer.offer_type) {
    case 'percent_discount': {
      const percent = benefit.discount_percent ?? 0;
      if (percent <= 0) return null;
      // Estimate based on current cart value or minimum qualifying amount
      const baseAmount = Math.max(cartTotal, benefit.min_cart_value ?? cartTotal);
      const estimatedSaving = baseAmount * (percent / 100);
      return {
        amount: estimatedSaving,
        display: `Save up to ${percent}%`
      };
    }
    
    case 'flat_discount': {
      const flatAmount = benefit.discount_amount ?? 0;
      if (flatAmount <= 0) return null;
      return {
        amount: flatAmount,
        display: `Save ₹${flatAmount}`
      };
    }
    
    case 'buy_x_get_y': {
      const buyQty = benefit.buy_qty ?? benefit.buy_quantity ?? 1;
      const getQty = benefit.get_qty ?? benefit.get_quantity ?? 1;
      const getDiscount = benefit.get_discount_percent ?? 100;
      // Estimate based on average item price in cart
      const avgItemPrice = itemCount > 0 ? cartTotal / itemCount : 100;
      const estimatedSaving = avgItemPrice * getQty * (getDiscount / 100);
      return {
        amount: estimatedSaving,
        display: getDiscount === 100 
          ? `Get ${getQty} free` 
          : `Get ${getQty} at ${getDiscount}% off`
      };
    }
    
    case 'tiered_discount': {
      const tiers = benefit.tiers ?? [];
      if (tiers.length === 0) return null;
      // Find the best tier
      const bestTier = tiers.reduce((best, tier) => {
        const discount = tier.discount ?? tier.discount_percent ?? 0;
        return discount > (best?.discount ?? 0) ? tier : best;
      }, tiers[0]);
      const discount = bestTier.discount ?? bestTier.discount_percent ?? 0;
      const estimatedSaving = cartTotal * (discount / 100);
      return {
        amount: estimatedSaving,
        display: `Up to ${discount}% off`
      };
    }
    
    case 'cheapest_item': {
      const discountPercent = benefit.discount_percent ?? 100;
      const avgItemPrice = itemCount > 0 ? cartTotal / itemCount : 100;
      // Cheapest item is typically lower than average
      const estimatedCheapest = avgItemPrice * 0.6;
      const estimatedSaving = estimatedCheapest * (discountPercent / 100);
      return {
        amount: estimatedSaving,
        display: discountPercent === 100 
          ? 'Cheapest item free' 
          : `${discountPercent}% off cheapest`
      };
    }
    
    case 'free_gift': {
      return {
        amount: 0,
        display: 'Free gift included'
      };
    }
    
    case 'cashback': {
      const cashbackPercent = benefit.cashback_percent ?? benefit.discount_percent ?? 0;
      const maxCashback = benefit.max_cashback;
      const estimated = cartTotal * (cashbackPercent / 100);
      const finalAmount = maxCashback ? Math.min(estimated, maxCashback) : estimated;
      return {
        amount: finalAmount,
        display: `${cashbackPercent}% cashback`
      };
    }
    
    case 'loyalty_points': {
      const pointsMultiplier = benefit.points_multiplier ?? 1;
      const bonusPoints = benefit.bonus_points ?? 0;
      return {
        amount: bonusPoints,
        display: `${pointsMultiplier}x points + ${bonusPoints} bonus`
      };
    }
    
    default:
      return null;
  }
};

// Parse missing conditions to extract actionable requirements with navigation
const parseRequirement = (condition: string): ParsedRequirement => {
  // Parse minimum cart value requirements
  const cartValueMatch = condition.match(/cart.*?(\d+)/i) || condition.match(/spend.*?(\d+)/i);
  if (cartValueMatch) {
    return {
      type: 'cart_value',
      action: `Add ₹${cartValueMatch[1]} more to your cart`,
      linkTo: '/products'
    };
  }

  // Parse quantity requirements
  const quantityMatch = condition.match(/(\d+)\s*(more\s+)?items?/i) || condition.match(/items?.*?(\d+)/i);
  if (quantityMatch) {
    return {
      type: 'quantity',
      action: `Add ${quantityMatch[1]} more item${parseInt(quantityMatch[1]) > 1 ? 's' : ''}`,
      linkTo: '/products'
    };
  }

  // Parse category requirements
  const categoryMatch = condition.match(/category[:\s]+(\w+)/i);
  if (categoryMatch) {
    const category = categoryMatch[1];
    return {
      type: 'category',
      action: `Add items from ${category} category`,
      linkTo: '/products',
      linkParams: { category }
    };
  }

  // Parse brand requirements
  const brandMatch = condition.match(/brand[:\s]+(\w+)/i);
  if (brandMatch) {
    const brand = brandMatch[1];
    return {
      type: 'brand',
      action: `Add ${brand} products`,
      linkTo: '/products',
      linkParams: { brand }
    };
  }

  // Default fallback with improved formatting
  return {
    type: 'other',
    action: condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    linkTo: '/products'
  };
};

const getRequirementIcon = (type: string) => {
  switch (type) {
    case 'cart_value':
      return <ShoppingCart className="h-3.5 w-3.5" />;
    case 'quantity':
      return <Package className="h-3.5 w-3.5" />;
    default:
      return <Tag className="h-3.5 w-3.5" />;
  }
};

// Build URL with query params for filtering
const buildProductsUrl = (req: ParsedRequirement): string => {
  if (!req.linkTo) return '/products';
  
  const params = new URLSearchParams();
  if (req.linkParams?.category) {
    params.set('category', req.linkParams.category);
  }
  if (req.linkParams?.brand) {
    params.set('brand', req.linkParams.brand);
  }
  
  const queryString = params.toString();
  return queryString ? `${req.linkTo}?${queryString}` : req.linkTo;
};

const PotentialSavingsDisplay = ({
  potentialSavings,
  isLoading = false,
}: PotentialSavingsDisplayProps) => {
  const { items, getCartTotal } = useCart();
  const cartTotal = getCartTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading || potentialSavings.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-amber-500/10">
            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-semibold text-amber-800 dark:text-amber-200">
            Unlock More Savings
          </span>
          <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
            {potentialSavings.length} offer{potentialSavings.length > 1 ? 's' : ''} available
          </Badge>
        </div>

        <div className="space-y-3">
          {potentialSavings.slice(0, 3).map((saving, index) => {
            const requirements = saving.missing.map(parseRequirement);
            const completedReqs = 0; // Could be calculated based on current cart state
            const totalReqs = requirements.length;
            const progressPercent = totalReqs > 0 ? ((totalReqs - saving.missing.length) / totalReqs) * 100 : 0;
            
            // Calculate estimated savings
            const estimatedSaving = estimateSavings(saving.offer, cartTotal, itemCount);

            return (
              <div
                key={`${saving.offer.id}-${index}`}
                className="p-3 rounded-lg bg-background/60 border border-amber-200/50 dark:border-amber-800/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-medium text-sm text-foreground">
                      {saving.offer.name}
                    </h4>
                    {saving.offer.marketing_text && (
                      <p className="text-xs text-muted-foreground">
                        {saving.offer.marketing_text}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20">
                      {saving.offer.offer_type.replace(/_/g, ' ')}
                    </Badge>
                    {/* Estimated savings badge */}
                    {estimatedSaving && (
                      <div className="flex items-center gap-1 text-xs">
                        <Sparkles className="h-3 w-3 text-green-600 dark:text-green-400" />
                        {estimatedSaving.amount > 0 ? (
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ~₹{Math.round(estimatedSaving.amount)} savings
                          </span>
                        ) : (
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {estimatedSaving.display}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimated savings highlight for large savings */}
                {estimatedSaving && estimatedSaving.amount >= 50 && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/30">
                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/50">
                      <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">
                        {estimatedSaving.display}
                      </p>
                      <p className="text-xs text-green-600/80 dark:text-green-400/80">
                        Estimated savings: ₹{Math.round(estimatedSaving.amount)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requirements list */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    What you need:
                  </p>
                {requirements.slice(0, 2).map((req, reqIndex) => (
                    <Link
                      key={reqIndex}
                      to={buildProductsUrl(req)}
                      className="flex items-center gap-2 text-sm group hover:bg-amber-100/50 dark:hover:bg-amber-900/20 p-1.5 -m-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                        {getRequirementIcon(req.type)}
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors">{req.action}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                  {requirements.length > 2 && (
                    <Link 
                      to="/products"
                      className="text-xs text-muted-foreground pl-7 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      +{requirements.length - 2} more requirement{requirements.length - 2 > 1 ? 's' : ''} →
                    </Link>
                  )}
                </div>

                {/* Progress indicator */}
                {totalReqs > 1 && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className="h-1.5 bg-amber-100 dark:bg-amber-900/30" 
                    />
                  </div>
                )}
              </div>
            );
          })}

          {potentialSavings.length > 3 && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              +{potentialSavings.length - 3} more potential offer{potentialSavings.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PotentialSavingsDisplay;
