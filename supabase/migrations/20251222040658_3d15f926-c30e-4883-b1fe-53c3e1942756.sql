-- Create categories table for reference data
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table for static/CDN-cacheable data
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_best_seller BOOLEAN DEFAULT false,
  cuisine TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_variants table for volatile data (prices & stock)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  size TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount_percent INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  last_price_update TIMESTAMPTZ DEFAULT now(),
  last_stock_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, size)
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_is_best_seller ON public.products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX idx_products_updated_at ON public.products(updated_at);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_stock ON public.product_variants(stock) WHERE stock > 0;
CREATE INDEX idx_product_variants_is_available ON public.product_variants(is_available) WHERE is_available = true;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for products (public read for CDN caching)
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for product_variants (public read for live inventory)
CREATE POLICY "Anyone can view product variants"
ON public.product_variants FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger to auto-update updated_at on products table
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, slug, display_order, is_active) VALUES
('All', 'all', 0, true),
('Beverages', 'beverages', 1, true),
('Dairy', 'dairy', 2, true),
('Staples', 'staples', 3, true),
('Spices', 'spices', 4, true),
('Snacks', 'snacks', 5, true),
('Instant Food', 'instant-food', 6, true);

-- Seed products (static data)
INSERT INTO public.products (sku, name, brand, category, description, image_url, is_best_seller, cuisine, dietary_tags) VALUES
('1', 'Bru Instant Coffee', 'Bru', 'Beverages', 'Premium instant coffee with rich aroma and smooth taste. Made from finest Arabica and Robusta beans.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', true, 'Pan-Indian', ARRAY['Vegetarian']),
('2', 'Tata Tea Gold', 'Tata Tea', 'Beverages', 'Premium tea leaves with 15% long leaves for stronger, richer taste. Perfect for your morning chai.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false, 'Pan-Indian', ARRAY['Vegetarian', 'Vegan']),
('3', 'Amul Butter', 'Amul', 'Dairy', 'Made from fresh cream, Amul Butter adds delicious taste to everything. The taste of India.', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', true, 'Pan-Indian', ARRAY['Vegetarian']),
('4', 'MTR Rava Idli Mix', 'MTR', 'Instant Food', 'Ready to cook rava idli mix. Just add water and make soft, fluffy idlis in minutes.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', false, 'South Indian', ARRAY['Vegetarian', 'Vegan']),
('5', 'Aashirvaad Atta', 'Aashirvaad', 'Staples', 'Made from the finest quality wheat, Aashirvaad Atta gives you soft rotis every time.', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', true, 'Pan-Indian', ARRAY['Vegetarian', 'Vegan']),
('6', 'MDH Garam Masala', 'MDH', 'Spices', 'A blend of finest spices for authentic Indian taste. The secret to perfect curries.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', false, 'North Indian', ARRAY['Vegetarian', 'Vegan', 'Gluten-Free']),
('7', 'Haldiram Bhujia', 'Haldiram', 'Snacks', 'Crispy and spicy besan sev. A perfect tea-time snack loved by all.', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', true, 'North Indian', ARRAY['Vegetarian']),
('8', 'Lijjat Papad', 'Lijjat', 'Snacks', 'Authentic Indian papads made with finest urad dal. Crispy and delicious.', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', false, 'Pan-Indian', ARRAY['Vegetarian', 'Vegan', 'Gluten-Free']),
('9', 'Mother Dairy Dahi', 'Mother Dairy', 'Dairy', 'Fresh and creamy dahi made from pure milk. Rich in probiotics.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', false, 'Pan-Indian', ARRAY['Vegetarian']),
('10', 'Patanjali Ghee', 'Patanjali', 'Dairy', 'Pure desi ghee made from cow milk. Adds rich flavor and aroma to your dishes.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true, 'Pan-Indian', ARRAY['Vegetarian']),
('11', 'Maggi 2-Minute Noodles', 'Maggi', 'Instant Food', 'India''s favorite instant noodles. Ready in just 2 minutes with the taste you love.', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, 'Pan-Indian', ARRAY['Vegetarian']),
('12', 'Everest Kashmiri Mirch', 'Everest', 'Spices', 'Premium quality Kashmiri red chilli powder for vibrant color and mild heat.', 'https://images.unsplash.com/photo-1599909533681-74d7ffe60d37?w=400', false, 'North Indian', ARRAY['Vegetarian', 'Vegan', 'Gluten-Free']),
('13', 'Britannia Good Day', 'Britannia', 'Snacks', 'Crunchy butter cookies that make every day a good day. Perfect with tea or coffee.', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', false, 'Pan-Indian', ARRAY['Vegetarian']),
('14', 'Catch Sprinklers', 'Catch', 'Spices', 'Convenient sprinkler pack of commonly used spices. Easy to use, great taste.', 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400', false, 'Pan-Indian', ARRAY['Vegetarian', 'Vegan', 'Gluten-Free']),
('15', 'Bikaji Rasgulla', 'Bikaji', 'Snacks', 'Soft and spongy rasgullas soaked in sugar syrup. A classic Bengali sweet.', 'https://images.unsplash.com/photo-1605197161470-5d57bac3dd9e?w=400', true, 'East Indian', ARRAY['Vegetarian']);