import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariant } from '@/types/product';

interface DBProduct {
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

interface DBProductVariant {
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

interface UseProductsOptions {
  category?: string;
  brands?: string[];
  cuisines?: string[];
  dietaryTags?: string[];
  inStockOnly?: boolean;
  bestSellersOnly?: boolean;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  categories: string[];
  allBrands: string[];
  allCuisines: string[];
  allDietaryTags: string[];
  refetch: () => Promise<void>;
}

// Transform database product to frontend Product type
function transformProduct(dbProduct: DBProduct, variants: DBProductVariant[]): Product {
  const productVariants: ProductVariant[] = variants.map(v => ({
    id: v.id,
    size: v.size,
    price: Number(v.price),
    stock: v.stock ?? 0
  }));

  // Calculate discount from first variant if exists
  const firstVariant = variants[0];
  const discount = firstVariant?.discount_percent ?? undefined;
  const originalPrice = firstVariant?.original_price ? Number(firstVariant.original_price) : undefined;

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    brand: dbProduct.brand,
    category: dbProduct.category,
    description: dbProduct.description ?? '',
    image: dbProduct.image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    variants: productVariants.length > 0 ? productVariants : [{ id: `${dbProduct.id}-default`, size: 'Standard', price: 0, stock: 0 }],
    isBestSeller: dbProduct.is_best_seller ?? false,
    discount: discount && discount > 0 ? discount : undefined,
    originalPrice,
    cuisine: dbProduct.cuisine ?? undefined,
    dietaryTags: dbProduct.dietary_tags ?? undefined
  };
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    category,
    brands,
    cuisines,
    dietaryTags,
    inStockOnly,
    bestSellersOnly,
    limit
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [allDBProducts, setAllDBProducts] = useState<DBProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all products with their variants
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

      // Store all DB products for metadata extraction
      setAllDBProducts(productsData || []);

      // Group variants by product_id
      const variantsByProduct: Record<string, DBProductVariant[]> = {};
      (variantsData || []).forEach(v => {
        if (!variantsByProduct[v.product_id]) {
          variantsByProduct[v.product_id] = [];
        }
        variantsByProduct[v.product_id].push(v);
      });

      // Transform products
      let transformedProducts = (productsData || []).map(p => 
        transformProduct(p, variantsByProduct[p.id] || [])
      );

      // Apply filters
      if (category && category !== 'All') {
        transformedProducts = transformedProducts.filter(p => p.category === category);
      }

      if (brands && brands.length > 0) {
        transformedProducts = transformedProducts.filter(p => brands.includes(p.brand));
      }

      if (cuisines && cuisines.length > 0) {
        transformedProducts = transformedProducts.filter(p => p.cuisine && cuisines.includes(p.cuisine));
      }

      if (dietaryTags && dietaryTags.length > 0) {
        transformedProducts = transformedProducts.filter(p => 
          p.dietaryTags && dietaryTags.some(tag => p.dietaryTags?.includes(tag))
        );
      }

      if (inStockOnly) {
        transformedProducts = transformedProducts.filter(p => 
          p.variants.some(v => v.stock > 0)
        );
      }

      if (bestSellersOnly) {
        transformedProducts = transformedProducts.filter(p => p.isBestSeller);
      }

      if (limit) {
        transformedProducts = transformedProducts.slice(0, limit);
      }

      setProducts(transformedProducts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, JSON.stringify(brands), JSON.stringify(cuisines), JSON.stringify(dietaryTags), inStockOnly, bestSellersOnly, limit]);

  // Derive metadata from all products
  const categories = useMemo(() => {
    const cats = new Set(allDBProducts.map(p => p.category));
    return ['All', ...Array.from(cats).sort()];
  }, [allDBProducts]);

  const allBrands = useMemo(() => {
    return Array.from(new Set(allDBProducts.map(p => p.brand))).sort();
  }, [allDBProducts]);

  const allCuisines = useMemo(() => {
    return Array.from(new Set(allDBProducts.map(p => p.cuisine).filter(Boolean) as string[])).sort();
  }, [allDBProducts]);

  const allDietaryTags = useMemo(() => {
    return Array.from(new Set(allDBProducts.flatMap(p => p.dietary_tags || []))).sort();
  }, [allDBProducts]);

  return {
    products,
    isLoading,
    error,
    categories,
    allBrands,
    allCuisines,
    allDietaryTags,
    refetch: fetchProducts
  };
}

// Hook for fetching a single product by ID
export function useProduct(productId: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (productError) throw productError;
        if (!productData) {
          setProduct(null);
          return;
        }

        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('price');

        if (variantsError) throw variantsError;

        setProduct(transformProduct(productData, variantsData || []));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, isLoading, error };
}
