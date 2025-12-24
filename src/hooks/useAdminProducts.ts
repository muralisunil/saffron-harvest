import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductFormData {
  sku: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  is_best_seller: boolean;
  cuisine: string;
  dietary_tags: string[];
}

export interface VariantFormData {
  sku: string;
  size: string;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock: number;
  is_available: boolean;
}

export interface DBProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_best_seller: boolean | null;
  cuisine: string | null;
  dietary_tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DBVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock: number | null;
  is_available: boolean | null;
}

export function useAdminProducts() {
  const [isLoading, setIsLoading] = useState(false);

  const createProduct = useCallback(async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          sku: data.sku,
          name: data.name,
          brand: data.brand,
          category: data.category,
          description: data.description || null,
          image_url: data.image_url || null,
          is_best_seller: data.is_best_seller,
          cuisine: data.cuisine || null,
          dietary_tags: data.dietary_tags.length > 0 ? data.dietary_tags : null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Product created successfully');
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // Delete variants first
      const { error: variantError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      if (variantError) throw variantError;

      // Then delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVariant = useCallback(async (productId: string, data: VariantFormData) => {
    setIsLoading(true);
    try {
      const { data: variant, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          sku: data.sku,
          size: data.size,
          price: data.price,
          original_price: data.original_price,
          discount_percent: data.discount_percent,
          stock: data.stock,
          is_available: data.is_available,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Variant created successfully');
      return variant;
    } catch (error) {
      console.error('Error creating variant:', error);
      toast.error('Failed to create variant');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVariant = useCallback(async (id: string, data: Partial<VariantFormData>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({
          ...data,
          last_price_update: new Date().toISOString(),
          last_stock_update: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Variant updated successfully');
    } catch (error) {
      console.error('Error updating variant:', error);
      toast.error('Failed to update variant');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteVariant = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Variant deleted successfully');
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Failed to delete variant');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
    updateVariant,
    deleteVariant,
  };
}
