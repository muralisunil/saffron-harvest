import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products, categories } from "@/data/products";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Apply filters from URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const brandParam = searchParams.get('brand');
    
    if (categoryParam) {
      // Find matching category (case-insensitive)
      const matchingCategory = categories.find(
        c => c.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matchingCategory) {
        setSelectedCategory(matchingCategory);
      }
    }
    
    if (brandParam) {
      // Find matching brand (case-insensitive)
      const allBrands = Array.from(new Set(products.map((p) => p.brand)));
      const matchingBrand = allBrands.find(
        b => b.toLowerCase() === brandParam.toLowerCase()
      );
      if (matchingBrand) {
        setSelectedBrands([matchingBrand]);
      }
    }
  }, [searchParams]);

  const allBrands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const allDietaryTags = Array.from(new Set(products.flatMap((p) => p.dietaryTags || []))).sort();
  const allCuisines = Array.from(new Set(products.map((p) => p.cuisine).filter(Boolean))).sort();

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
    if (selectedCuisines.length > 0 && (!p.cuisine || !selectedCuisines.includes(p.cuisine))) return false;
    if (selectedDietaryTags.length > 0) {
      const hasMatchingTag = selectedDietaryTags.some((tag) => p.dietaryTags?.includes(tag));
      if (!hasMatchingTag) return false;
    }
    if (inStockOnly && !p.variants.some((v) => v.stock > 0)) return false;
    return true;
  });

  // Simple rule-based recommendations
  const getRecommendations = () => {
    if (filteredProducts.length === 0) return [];
    
    // Recommend best sellers first
    const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 5);
    
    // Add complementary products based on category
    const categoryMap: Record<string, string[]> = {
      "Beverages": ["Snacks"],
      "Staples": ["Spices"],
      "Dairy": ["Staples"],
    };
    
    const complementaryProducts = selectedCategory !== "All" && categoryMap[selectedCategory]
      ? products.filter((p) => categoryMap[selectedCategory].includes(p.category)).slice(0, 3)
      : [];
    
    return [...new Set([...bestSellers, ...complementaryProducts])].slice(0, 6);
  };

  const recommendations = getRecommendations();

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleDietaryTag = (tag: string) => {
    setSelectedDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedBrands([]);
    setSelectedDietaryTags([]);
    setSelectedCuisines([]);
    setInStockOnly(false);
  };

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) +
    selectedBrands.length +
    selectedDietaryTags.length +
    selectedCuisines.length +
    (inStockOnly ? 1 : 0);

  const FilterSection = () => (
    <div className="space-y-6">
      {/* Dietary Tags */}
      {allDietaryTags.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Dietary Preferences</h3>
          <div className="space-y-2">
            {allDietaryTags.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`dietary-${tag}`}
                  checked={selectedDietaryTags.includes(tag)}
                  onCheckedChange={() => toggleDietaryTag(tag)}
                />
                <Label htmlFor={`dietary-${tag}`} className="cursor-pointer">
                  {tag}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      <div>
        <h3 className="font-semibold mb-3">Brand</h3>
        <div className="space-y-2">
          {allBrands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={`brand-${brand}`} className="cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Cuisine Filter */}
      {allCuisines.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Cuisine</h3>
          <div className="space-y-2">
            {allCuisines.map((cuisine) => (
              <div key={cuisine} className="flex items-center space-x-2">
                <Checkbox
                  id={`cuisine-${cuisine}`}
                  checked={selectedCuisines.includes(cuisine)}
                  onCheckedChange={() => toggleCuisine(cuisine)}
                />
                <Label htmlFor={`cuisine-${cuisine}`} className="cursor-pointer">
                  {cuisine}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Stock Only */}
      <div>
        <h3 className="font-semibold mb-3">Availability</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
          />
          <Label htmlFor="in-stock" className="cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Browse our complete collection of authentic Indian groceries
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="transition-all"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterSection />
              </CardContent>
            </Card>
          </aside>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden mb-4">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSection />
              </div>
            </SheetContent>
          </Sheet>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold mb-4">Recommended for You</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recommendations.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                All Products ({filteredProducts.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  No products found matching your filters
                </p>
                <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
