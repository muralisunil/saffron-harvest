import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/home/HeroSection";
import CategoryCards from "@/components/home/CategoryCards";
import PromoBanner from "@/components/home/PromoBanner";
import ProductSection from "@/components/home/ProductSection";
import DealsSection from "@/components/home/DealsSection";
import QuickViewModal from "@/components/QuickViewModal";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = "standard" | "cuisine" | "curated";

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const { products, isLoading } = useProducts({});

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  // Load recently viewed products
  useEffect(() => {
    if (products.length === 0) return;
    
    const viewed = localStorage.getItem("recentlyViewed");
    if (viewed) {
      const viewedIds = JSON.parse(viewed);
      const viewedProducts = products.filter(p => viewedIds.includes(p.id)).slice(0, 8);
      setRecentlyViewedProducts(viewedProducts);
    }
  }, [products]);

  // Derived product collections
  const bestSellers = useMemo(() => products.filter((p) => p.isBestSeller).slice(0, 8), [products]);
  const dealProducts = useMemo(() => products.filter((p) => p.discount).slice(0, 4), [products]);
  const staples = useMemo(() => products.filter(p => p.category === "Staples").slice(0, 4), [products]);
  const snacks = useMemo(() => products.filter(p => p.category === "Snacks").slice(0, 4), [products]);
  const beverages = useMemo(() => products.filter(p => p.category === "Beverages").slice(0, 4), [products]);
  const instantFood = useMemo(() => products.filter(p => p.category === "Instant Food").slice(0, 4), [products]);
  
  // Cuisine-based groupings
  const cuisineGroups = useMemo(() => ({
    "North Indian Essentials": products.filter(p => 
      ["Staples", "Spices", "Dairy"].includes(p.category)
    ).slice(0, 8),
    "South Indian Favorites": products.filter(p => 
      p.category === "Instant Food" || p.brand === "MTR"
    ).slice(0, 8),
    "Snack Time Delights": products.filter(p => 
      p.category === "Snacks"
    ).slice(0, 8),
    "Beverage Station": products.filter(p => 
      p.category === "Beverages"
    ).slice(0, 8),
  }), [products]);

  // Curated collections
  const curatedCollections = useMemo(() => ({
    "Quick Meals": products.filter(p => 
      p.category === "Instant Food"
    ).slice(0, 8),
    "Pantry Staples": products.filter(p => 
      ["Staples", "Spices"].includes(p.category)
    ).slice(0, 8),
    "Festive Essentials": products.filter(p => 
      p.isBestSeller || ["Dairy", "Snacks"].includes(p.category)
    ).slice(0, 8),
    "Daily Needs": products.filter(p => 
      ["Dairy", "Beverages"].includes(p.category)
    ).slice(0, 8),
  }), [products]);

  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Full bleed with gradient extending to page */}
        <section className="relative">
          <HeroSection />
          {/* Gradient continuation for seamless blend */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        </section>

        {/* Category Cards - Overlapping hero */}
        <section className="container relative z-10 -mt-24 md:-mt-28 pb-16">
          <CategoryCards />
        </section>

        {/* Promotional Banner */}
        <section className="container py-8">
          <PromoBanner />
        </section>

        {/* Today's Hot Deals with Countdown Timers */}
        <section className="container">
          <DealsSection dealProducts={dealProducts} onQuickView={handleQuickView} isLoading={isLoading} />
        </section>

        {/* View Mode Toggle Section */}
        <section className="container py-8">
          <motion.div 
            className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-8 md:p-10 border border-border/30"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 text-foreground">Explore Products Your Way</h2>
                <p className="text-muted-foreground text-base">Choose how you'd like to browse</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "standard", label: "Standard View" },
                  { key: "cuisine", label: "Cuisine Explorer" },
                  { key: "curated", label: "Curated Collections" },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    onClick={() => setViewMode(key as ViewMode)}
                    variant={viewMode === key ? "default" : "outline"}
                    className={viewMode === key ? "shadow-lg" : ""}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Standard View */}
            {viewMode === "standard" && (
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <h3 className="text-xl font-bold mb-6 text-foreground">Best Sellers</h3>
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {bestSellers.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Cuisine Explorer View */}
            {viewMode === "cuisine" && (
              <motion.div 
                className="space-y-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {Object.entries(cuisineGroups).map(([cuisineName, cuisineProducts]) => (
                  <div key={cuisineName}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-foreground">{cuisineName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group text-primary">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {cuisineProducts.map((product, index) => (
                          <div key={product.id} className="flex-none w-[220px]">
                            <ProductCard product={product} index={index} />
                          </div>
                        ))}
                        <Link to="/products" className="flex-none w-[220px]">
                          <div className="h-full min-h-[380px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-card/50 transition-all duration-300 cursor-pointer hover:bg-card">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <ChevronRight className="h-7 w-7 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">View All</span>
                          </div>
                        </Link>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Curated Collections View */}
            {viewMode === "curated" && (
              <motion.div 
                className="space-y-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {Object.entries(curatedCollections).map(([collectionName, collectionProducts]) => (
                  <div key={collectionName}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-foreground">{collectionName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group text-primary">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {collectionProducts.map((product, index) => (
                          <div key={product.id} className="flex-none w-[220px]">
                            <ProductCard product={product} index={index} />
                          </div>
                        ))}
                        <Link to="/products" className="flex-none w-[220px]">
                          <div className="h-full min-h-[380px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-card/50 transition-all duration-300 cursor-pointer hover:bg-card">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <ChevronRight className="h-7 w-7 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">View All</span>
                          </div>
                        </Link>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <section className="container">
            <ProductSection title="Your Recently Viewed" products={recentlyViewedProducts} showViewAll={false} />
          </section>
        )}

        {/* Category Sections */}
        {!isLoading && staples.length > 0 && (
          <section className="container">
            <ProductSection title="Staples & Grains" products={staples} />
          </section>
        )}

        {!isLoading && snacks.length > 0 && (
          <section className="container">
            <ProductSection title="Snacks & Treats" products={snacks} />
          </section>
        )}

        {!isLoading && beverages.length > 0 && (
          <section className="container">
            <ProductSection title="Beverages" products={beverages} />
          </section>
        )}

        {!isLoading && instantFood.length > 0 && (
          <section className="container pb-16">
            <ProductSection title="Quick & Easy Meals" products={instantFood} />
          </section>
        )}
      </main>

      <Footer />

      {/* Quick View Modal */}
      <QuickViewModal 
        product={quickViewProduct} 
        open={quickViewOpen} 
        onOpenChange={setQuickViewOpen} 
      />
    </div>
  );
};

export default Index;
