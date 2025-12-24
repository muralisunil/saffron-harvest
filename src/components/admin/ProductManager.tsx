import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminProducts, DBProduct, DBVariant, ProductFormData, VariantFormData } from '@/hooks/useAdminProducts';
import { ProductFormDialog } from './ProductFormDialog';
import { VariantFormDialog } from './VariantFormDialog';

export function ProductManager() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [variants, setVariants] = useState<Record<string, DBVariant[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);
  const [editingVariant, setEditingVariant] = useState<DBVariant | null>(null);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<DBProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'variant'; id: string; name: string } | null>(null);

  const { isLoading: isSaving, createProduct, updateProduct, deleteProduct, createVariant, updateVariant, deleteVariant } = useAdminProducts();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('sku');

      if (productsError) throw productsError;

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .order('price');

      if (variantsError) throw variantsError;

      setProducts(productsData || []);

      // Group variants by product_id
      const grouped: Record<string, DBVariant[]> = {};
      (variantsData || []).forEach(v => {
        if (!grouped[v.product_id]) grouped[v.product_id] = [];
        grouped[v.product_id].push(v);
      });
      setVariants(grouped);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSubmit = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setEditingProduct(null);
    fetchProducts();
  };

  const handleVariantSubmit = async (data: VariantFormData) => {
    if (editingVariant) {
      await updateVariant(editingVariant.id, data);
    } else if (selectedProductForVariant) {
      await createVariant(selectedProductForVariant.id, data);
    }
    setEditingVariant(null);
    setSelectedProductForVariant(null);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'product') {
      await deleteProduct(deleteTarget.id);
    } else {
      await deleteVariant(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchProducts();
  };

  const openAddVariant = (product: DBProduct) => {
    setSelectedProductForVariant(product);
    setEditingVariant(null);
    setVariantDialogOpen(true);
  };

  const openEditVariant = (product: DBProduct, variant: DBVariant) => {
    setSelectedProductForVariant(product);
    setEditingVariant(variant);
    setVariantDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Management ({products.length} products)
            </CardTitle>
            <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search products by name, brand, or SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            {filteredProducts.map(product => (
              <div key={product.id} className="border rounded-lg">
                {/* Product Row */}
                <div className="flex items-center gap-3 p-4 hover:bg-muted/50">
                  <button
                    onClick={() => toggleExpanded(product.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {expandedProducts.has(product.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{product.name}</span>
                      {product.is_best_seller && (
                        <Badge variant="secondary" className="text-xs">Best Seller</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.brand} • {product.category} • SKU: {product.sku}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {variants[product.id]?.length || 0} variants
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingProduct(product); setProductDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget({ type: 'product', id: product.id, name: product.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Variants */}
                {expandedProducts.has(product.id) && (
                  <div className="border-t bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Variants</span>
                      <Button size="sm" variant="outline" onClick={() => openAddVariant(product)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Variant
                      </Button>
                    </div>

                    {variants[product.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {variants[product.id].map(variant => (
                          <div 
                            key={variant.id}
                            className="flex items-center justify-between p-3 bg-background rounded-md border"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="font-medium">{variant.size}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  (SKU: {variant.sku})
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-semibold">₹{Number(variant.price).toFixed(2)}</span>
                                {variant.original_price && (
                                  <span className="text-muted-foreground line-through ml-2">
                                    ₹{Number(variant.original_price).toFixed(2)}
                                  </span>
                                )}
                                {variant.discount_percent && variant.discount_percent > 0 && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    {variant.discount_percent}% off
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Stock: {variant.stock || 0}
                              </div>
                              {!variant.is_available && (
                                <Badge variant="outline" className="text-xs">Unavailable</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditVariant(product, variant)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget({ type: 'variant', id: variant.id, name: `${product.name} - ${variant.size}` })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No variants yet. Add one to make this product available for sale.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No products match your search.' : 'No products yet. Create your first product!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        onSubmit={handleProductSubmit}
        isLoading={isSaving}
      />

      <VariantFormDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        variant={editingVariant}
        productName={selectedProductForVariant?.name || ''}
        onSubmit={handleVariantSubmit}
        isLoading={isSaving}
      />

      <AlertDialog open={deleteDialogOpen || !!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              {deleteTarget?.type === 'product' && ' All variants will also be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
