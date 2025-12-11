import { useState, useEffect } from "react";
import { Mail, Send, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AbandonedCart {
  id: string;
  session_id: string;
  cart_items: unknown;
  cart_total: number;
  abandoned_at: string | null;
  recovered: boolean | null;
}

export const CartRecoveryManager = () => {
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const fetchAbandonedCarts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_sessions")
        .select("*")
        .eq("abandoned", true)
        .eq("checkout_completed", false)
        .order("abandoned_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setAbandonedCarts(data || []);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch abandoned carts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendRecoveryEmail = async (cart: AbandonedCart) => {
    const email = emailInputs[cart.id];
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send recovery email",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(cart.id);
    try {
      const response = await supabase.functions.invoke("send-cart-recovery", {
        body: {
          cartSessionId: cart.id,
          email: email,
          storeName: "Desi Pantry",
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Email sent!",
        description: `Recovery email sent to ${email}`,
      });

      // Refresh the list
      fetchAbandonedCarts();
    } catch (error: any) {
      console.error("Error sending recovery email:", error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCartItems = (items: unknown): any[] => {
    if (Array.isArray(items)) return items;
    return [];
  };

  const getItemCount = (items: unknown) => {
    const cartItems = getCartItems(items);
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Cart Recovery Manager
            </CardTitle>
            <CardDescription>
              Send recovery emails to customers who abandoned their carts
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAbandonedCarts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : abandonedCarts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-secondary" />
            <p className="font-medium">No abandoned carts!</p>
            <p className="text-sm">All customers completed their checkout</p>
          </div>
        ) : (
          <div className="space-y-4">
            {abandonedCarts.map((cart) => (
              <div
                key={cart.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {getItemCount(cart.cart_items)} items · ₹{cart.cart_total?.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Abandoned {formatDate(cart.abandoned_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cart.recovered ? "default" : "secondary"}>
                    {cart.recovered ? "Recovered" : "Pending"}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`email-${cart.id}`} className="sr-only">
                      Customer Email
                    </Label>
                    <Input
                      id={`email-${cart.id}`}
                      type="email"
                      placeholder="Enter customer email"
                      value={emailInputs[cart.id] || ""}
                      onChange={(e) =>
                        setEmailInputs((prev) => ({
                          ...prev,
                          [cart.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => sendRecoveryEmail(cart)}
                    disabled={sendingEmail === cart.id || !emailInputs[cart.id]}
                  >
                    {sendingEmail === cart.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>

                {getCartItems(cart.cart_items).length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Items: </span>
                    {getCartItems(cart.cart_items)
                      .slice(0, 3)
                      .map((item: any) => item.productName)
                      .join(", ")}
                    {getCartItems(cart.cart_items).length > 3 && ` +${getCartItems(cart.cart_items).length - 3} more`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
