import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DBVariant, VariantFormData } from '@/hooks/useAdminProducts';

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: DBVariant | null;
  productName: string;
  onSubmit: (data: VariantFormData) => Promise<void>;
  isLoading?: boolean;
}

export function VariantFormDialog({ 
  open, 
  onOpenChange, 
  variant,
  productName,
  onSubmit,
  isLoading 
}: VariantFormDialogProps) {
  const [formData, setFormData] = useState<VariantFormData>({
    sku: '',
    size: '',
    price: 0,
    original_price: null,
    discount_percent: 0,
    stock: 0,
    is_available: true,
  });

  useEffect(() => {
    if (variant) {
      setFormData({
        sku: variant.sku,
        size: variant.size,
        price: Number(variant.price),
        original_price: variant.original_price ? Number(variant.original_price) : null,
        discount_percent: variant.discount_percent || 0,
        stock: variant.stock || 0,
        is_available: variant.is_available ?? true,
      });
    } else {
      setFormData({
        sku: '',
        size: '',
        price: 0,
        original_price: null,
        discount_percent: 0,
        stock: 0,
        is_available: true,
      });
    }
  }, [variant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {variant ? 'Edit Variant' : 'Add Variant'} - {productName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variant-sku">SKU *</Label>
              <Input
                id="variant-sku"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                required
                placeholder="e.g., PROD-100G"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size *</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={e => setFormData(prev => ({ ...prev, size: e.target.value }))}
                required
                placeholder="e.g., 100g, 1kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price (₹)</Label>
              <Input
                id="original_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.original_price || ''}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  original_price: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                placeholder="For discounts"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_percent">Discount %</Label>
              <Input
                id="discount_percent"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={e => setFormData(prev => ({ ...prev, discount_percent: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={e => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_available: checked }))}
            />
            <Label htmlFor="is_available">Available for sale</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : variant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
