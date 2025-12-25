import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  cancelled_quantity: number;
  refunded_amount: number;
}

export interface OrderRefund {
  id: string;
  order_id: string;
  stripe_refund_id: string | null;
  amount: number;
  reason: string | null;
  refund_type: string;
  refunded_items: unknown[];
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  refund_amount: number;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  order_refunds?: OrderRefund[];
}

export interface RefundRequest {
  orderId: string;
  refundType: "full" | "partial_amount" | "item_cancellation";
  amount?: number;
  reason?: string;
  cancelledItems?: Array<{
    orderItemId: string;
    quantity: number;
    refundAmount: number;
  }>;
}

export function useOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*),
          order_refunds(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const processRefund = useMutation({
    mutationFn: async (request: RefundRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("process-refund", {
        body: request,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to process refund");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Refund processed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process refund");
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const updateData: Record<string, unknown> = { 
        status, 
        updated_at: new Date().toISOString() 
      };

      if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      } else if (status === "shipped") {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  return {
    orders,
    isLoading,
    error,
    processRefund,
    updateOrderStatus,
  };
}
