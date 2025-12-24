import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DBProduct, ProductFormData } from '@/hooks/useAdminProducts';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: DBProduct | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORIES = ['Beverages', 'Dairy', 'Instant Food', 'Snacks', 'Spices', 'Staples'];
const CUISINES = ['Pan-Indian', 'North Indian', 'South Indian', 'East Indian', 'West Indian'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Organic'];

export function ProductFormDialog({ 
  open, 
  onOpenChange, 
  product, 
  onSubmit,
  isLoading 
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    brand: '',
    category: CATEGORIES[0],
    description: '',
    image_url: '',
    is_best_seller: false,
    cuisine: '',
    dietary_tags: [],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description || '',
        image_url: product.image_url || '',
        is_best_seller: product.is_best_seller || false,
        cuisine: product.cuisine || '',
        dietary_tags: product.dietary_tags || [],
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        brand: '',
        category: CATEGORIES[0],
        description: '',
        image_url: '',
        is_best_seller: false,
        cuisine: '',
        dietary_tags: [],
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                required
                disabled={!!product}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine</Label>
              <select
                id="cuisine"
                value={formData.cuisine}
                onChange={e => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select cuisine...</option>
                {CUISINES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="is_best_seller"
                checked={formData.is_best_seller}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_best_seller: checked }))}
              />
              <Label htmlFor="is_best_seller">Best Seller</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dietary Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant={formData.dietary_tags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDietaryTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
