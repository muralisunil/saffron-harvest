import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Order, OrderItem, RefundRequest } from "@/hooks/useOrders";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSubmit: (request: RefundRequest) => void;
  isLoading: boolean;
}

export function RefundDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
  isLoading,
}: RefundDialogProps) {
  const [refundType, setRefundType] = useState<"full" | "partial_amount" | "item_cancellation">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; refundAmount: number }>>(new Map());

  if (!order) return null;

  const alreadyRefunded = Number(order.refund_amount || 0);
  const maxRefundable = Number(order.total_amount) - alreadyRefunded;

  const handleItemToggle = (item: OrderItem, checked: boolean) => {
    const newSelected = new Map(selectedItems);
    if (checked) {
      const availableQty = item.quantity - (item.cancelled_quantity || 0);
      const pricePerUnit = item.unit_price;
      newSelected.set(item.id, {
        quantity: availableQty,
        refundAmount: availableQty * pricePerUnit,
      });
    } else {
      newSelected.delete(item.id);
    }
    setSelectedItems(newSelected);
  };

  const handleItemQuantityChange = (item: OrderItem, quantity: number) => {
    const availableQty = item.quantity - (item.cancelled_quantity || 0);
    const validQty = Math.min(Math.max(1, quantity), availableQty);
    const pricePerUnit = item.unit_price;
    
    const newSelected = new Map(selectedItems);
    newSelected.set(item.id, {
      quantity: validQty,
      refundAmount: validQty * pricePerUnit,
    });
    setSelectedItems(newSelected);
  };

  const calculateItemsRefundTotal = () => {
    let total = 0;
    selectedItems.forEach((value) => {
      total += value.refundAmount;
    });
    return total;
  };

  const handleSubmit = () => {
    const request: RefundRequest = {
      orderId: order.id,
      refundType,
      reason: reason || undefined,
    };

    if (refundType === "partial_amount") {
      request.amount = parseFloat(amount);
    } else if (refundType === "item_cancellation") {
      request.cancelledItems = Array.from(selectedItems.entries()).map(([orderItemId, data]) => ({
        orderItemId,
        quantity: data.quantity,
        refundAmount: data.refundAmount,
      }));
    }

    onSubmit(request);
  };

  const getRefundAmount = () => {
    if (refundType === "full") return maxRefundable;
    if (refundType === "partial_amount") return parseFloat(amount) || 0;
    if (refundType === "item_cancellation") return calculateItemsRefundTotal();
    return 0;
  };

  const isValid = () => {
    const refundAmount = getRefundAmount();
    if (refundAmount <= 0 || refundAmount > maxRefundable) return false;
    if (refundType === "item_cancellation" && selectedItems.size === 0) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Refund - {order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Order Total:</div>
              <div className="font-medium">${Number(order.total_amount).toFixed(2)}</div>
              <div>Already Refunded:</div>
              <div className="font-medium text-destructive">${alreadyRefunded.toFixed(2)}</div>
              <div>Max Refundable:</div>
              <div className="font-medium text-primary">${maxRefundable.toFixed(2)}</div>
            </div>
          </div>

          {/* Refund Type Selection */}
          <div className="space-y-3">
            <Label>Refund Type</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value) => {
                setRefundType(value as typeof refundType);
                setSelectedItems(new Map());
                setAmount("");
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal">
                  Full Refund (${maxRefundable.toFixed(2)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_amount" id="partial_amount" />
                <Label htmlFor="partial_amount" className="font-normal">
                  Partial Amount
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="item_cancellation" id="item_cancellation" />
                <Label htmlFor="item_cancellation" className="font-normal">
                  Cancel Specific Items
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Partial Amount Input */}
          {refundType === "partial_amount" && (
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Item Selection */}
          {refundType === "item_cancellation" && (
            <div className="space-y-3">
              <Label>Select Items to Cancel</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {order.order_items.map((item) => {
                  const availableQty = item.quantity - (item.cancelled_quantity || 0);
                  if (availableQty <= 0) return null;

                  const isSelected = selectedItems.has(item.id);
                  const selectedData = selectedItems.get(item.id);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemToggle(item, checked as boolean)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.variant_name && (
                              <div className="text-sm text-muted-foreground">{item.variant_name}</div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Number(item.unit_price).toFixed(2)} each
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-3">
                            <Label className="text-sm">Qty to cancel:</Label>
                            <Input
                              type="number"
                              min={1}
                              max={availableQty}
                              value={selectedData?.quantity || availableQty}
                              onChange={(e) => handleItemQuantityChange(item, parseInt(e.target.value))}
                              className="w-20 h-8"
                            />
                            <span className="text-sm text-muted-foreground">
                              of {availableQty} available
                            </span>
                            <span className="ml-auto font-medium">
                              ${selectedData?.refundAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedItems.size > 0 && (
                <div className="text-right font-medium">
                  Items Refund Total: ${calculateItemsRefundTotal().toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund..."
              rows={3}
            />
          </div>

          {/* Refund Summary */}
          <div className="rounded-lg border-2 border-primary p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Refund Amount:</span>
              <span className="text-2xl font-bold text-primary">
                ${getRefundAmount().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid() || isLoading}
            variant="destructive"
          >
            {isLoading ? "Processing..." : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
