import { Tag, AlertCircle, Gift, Percent, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ApplicationPlan } from "@/lib/offers/types";

interface RejectionLog {
  offer_id: string;
  offer_name: string;
  reason: string;
  details: string;
}

interface CartDiscountDisplayProps {
  applicablePlans: ApplicationPlan[];
  totalDiscount: number;
  rejectionLogs: RejectionLog[];
  isLoading?: boolean;
}

const getOfferIcon = (offerType: string) => {
  switch (offerType) {
    case "percent_discount":
      return <Percent className="h-4 w-4" />;
    case "free_gift":
    case "free_item":
      return <Gift className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
};

const CartDiscountDisplay = ({
  applicablePlans,
  totalDiscount,
  rejectionLogs,
  isLoading = false,
}: CartDiscountDisplayProps) => {
  const [showRejected, setShowRejected] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Checking for offers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applicablePlans.length === 0 && rejectionLogs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Applied Offers */}
      {applicablePlans.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">
                  Offers Applied
                </span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {applicablePlans.length} offer{applicablePlans.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <Separator className="bg-primary/10" />

            <div className="space-y-2">
              {applicablePlans.map((plan, index) => (
                <div
                  key={`${plan.offer_id}-${index}`}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm">{plan.offer_name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    -₹{plan.total_discount.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="bg-primary/10" />

            <div className="flex items-center justify-between font-bold">
              <span className="text-primary">Total Savings</span>
              <span className="text-green-600 text-lg">
                -₹{totalDiscount.toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Offers */}
      {rejectionLogs.length > 0 && (
        <Collapsible open={showRejected} onOpenChange={setShowRejected}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {rejectionLogs.length} offer{rejectionLogs.length > 1 ? "s" : ""} not applied
                </span>
              </div>
              {showRejected ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Card className="mt-2 border-muted bg-muted/30">
              <CardContent className="p-3 space-y-2">
                {rejectionLogs.map((log, index) => (
                  <div
                    key={`${log.offer_id}-${index}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">{log.offer_name}</span>
                      <p className="text-muted-foreground text-xs">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default CartDiscountDisplay;
