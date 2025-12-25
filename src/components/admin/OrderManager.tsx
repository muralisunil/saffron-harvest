import { useState } from "react";
import { useOrders, Order } from "@/hooks/useOrders";
import { RefundDialog } from "./RefundDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw, Search, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-700 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
  refunded: "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700",
  paid: "bg-green-500/20 text-green-700",
  failed: "bg-red-500/20 text-red-700",
  refunded: "bg-gray-500/20 text-gray-700",
};

export function OrderManager() {
  const { orders, isLoading, processRefund, updateOrderStatus } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);

  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Refunded</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <Collapsible key={order.id} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6"
                            onClick={() => toggleExpanded(order.id)}
                          >
                            {expandedOrders.has(order.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.shipping_name || "Guest"}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.shipping_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={paymentStatusColors[order.payment_status]}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(order.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(order.refund_amount) > 0 && (
                          <span className="text-destructive">
                            -${Number(order.refund_amount).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateOrderStatus.mutate({ orderId: order.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefundOrder(order)}
                            disabled={
                              Number(order.refund_amount) >= Number(order.total_amount) ||
                              order.payment_status === "pending"
                            }
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Refund
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          {expandedOrders.has(order.id) && (
                            <div className="p-4 bg-muted/30 space-y-4">
                              {/* Order Items */}
                              <div>
                                <h4 className="font-medium mb-2">Order Items</h4>
                                <div className="space-y-2">
                                  {order.order_items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-2 bg-background rounded border"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{item.product_name}</div>
                                        {item.variant_name && (
                                          <div className="text-sm text-muted-foreground">
                                            {item.variant_name}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground px-4">
                                        {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                                        {item.cancelled_quantity > 0 && (
                                          <span className="text-destructive ml-2">
                                            ({item.cancelled_quantity} cancelled)
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-medium w-24 text-right">
                                        ${Number(item.total_price).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Shipping Info */}
                              {order.shipping_address && (
                                <div>
                                  <h4 className="font-medium mb-2">Shipping Address</h4>
                                  <div className="text-sm text-muted-foreground">
                                    <p>{order.shipping_name}</p>
                                    <p>{order.shipping_address}</p>
                                    <p>
                                      {order.shipping_city}, {order.shipping_state}{" "}
                                      {order.shipping_pincode}
                                    </p>
                                    {order.shipping_phone && <p>Phone: {order.shipping_phone}</p>}
                                  </div>
                                </div>
                              )}

                              {/* Refund History */}
                              {order.order_refunds && order.order_refunds.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Refund History</h4>
                                  <div className="space-y-2">
                                    {order.order_refunds.map((refund) => (
                                      <div
                                        key={refund.id}
                                        className="flex items-center justify-between p-2 bg-destructive/10 rounded border border-destructive/20"
                                      >
                                        <div>
                                          <span className="font-medium">
                                            {refund.refund_type === "full"
                                              ? "Full Refund"
                                              : refund.refund_type === "partial_amount"
                                              ? "Partial Amount"
                                              : "Item Cancellation"}
                                          </span>
                                          {refund.reason && (
                                            <span className="text-sm text-muted-foreground ml-2">
                                              - {refund.reason}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm text-muted-foreground">
                                            {format(new Date(refund.created_at), "MMM d, yyyy HH:mm")}
                                          </span>
                                          <span className="font-medium text-destructive">
                                            -${Number(refund.amount).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Order Totals */}
                              <div className="border-t pt-4">
                                <div className="flex justify-end">
                                  <div className="w-64 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>${Number(order.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Shipping:</span>
                                      <span>${Number(order.shipping_cost).toFixed(2)}</span>
                                    </div>
                                    {Number(order.tax_amount) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>${Number(order.tax_amount).toFixed(2)}</span>
                                      </div>
                                    )}
                                    {Number(order.discount_amount) > 0 && (
                                      <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>-${Number(order.discount_amount).toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-medium border-t pt-1">
                                      <span>Total:</span>
                                      <span>${Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    {Number(order.refund_amount) > 0 && (
                                      <div className="flex justify-between text-destructive">
                                        <span>Refunded:</span>
                                        <span>-${Number(order.refund_amount).toFixed(2)}</span>
                                      </div>
                                    )}
                                    {Number(order.refund_amount) > 0 && (
                                      <div className="flex justify-between font-bold border-t pt-1">
                                        <span>Net:</span>
                                        <span>
                                          $
                                          {(
                                            Number(order.total_amount) - Number(order.refund_amount)
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Refund Dialog */}
      <RefundDialog
        open={!!refundOrder}
        onOpenChange={(open) => !open && setRefundOrder(null)}
        order={refundOrder}
        onSubmit={(request) => {
          processRefund.mutate(request, {
            onSuccess: () => setRefundOrder(null),
          });
        }}
        isLoading={processRefund.isPending}
      />
    </div>
  );
}
