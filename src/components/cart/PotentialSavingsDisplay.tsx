import { TrendingUp, ArrowRight, ShoppingCart, Package, Tag, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import type { Offer } from "@/lib/offers/types";

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

            return (
              <div
                key={`${saving.offer.id}-${index}`}
                className="p-3 rounded-lg bg-background/60 border border-amber-200/50 dark:border-amber-800/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-foreground">
                      {saving.offer.name}
                    </h4>
                    {saving.offer.marketing_text && (
                      <p className="text-xs text-muted-foreground">
                        {saving.offer.marketing_text}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shrink-0">
                    {saving.offer.offer_type.replace(/_/g, ' ')}
                  </Badge>
                </div>

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
