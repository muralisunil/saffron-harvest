import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Tag, Sparkles, Package, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { products } from "@/data/products";

type ViewMode = "standard" | "cuisine" | "curated";

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [recentlyViewed, setRecentlyViewed] = useState<typeof products>([]);

  useEffect(() => {
    const viewed = localStorage.getItem("recentlyViewed");
    if (viewed) {
      const viewedIds = JSON.parse(viewed);
      const viewedProducts = products.filter(p => viewedIds.includes(p.id)).slice(0, 8);
      setRecentlyViewed(viewedProducts);
    }
  }, []);

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 8);
  const specialDeals = products.filter((p) => p.discount).slice(0, 8);
  const staples = products.filter(p => p.category === "Staples").slice(0, 4);
  const snacks = products.filter(p => p.category === "Snacks").slice(0, 4);
  const beverages = products.filter(p => p.category === "Beverages").slice(0, 4);
  const instantFood = products.filter(p => p.category === "Instant Food").slice(0, 4);
  
  const categories = [
    { name: "Staples & Grains", icon: Package, iconColor: "text-amber-600" },
    { name: "Snacks", icon: ShoppingBag, iconColor: "text-rose-600" },
    { name: "Beverages", icon: Sparkles, iconColor: "text-blue-600" },
    { name: "Instant Food", icon: Tag, iconColor: "text-emerald-600" },
  ];

  // Cuisine-based groupings
  const cuisineGroups = {
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
  };

  // Curated collections
  const curatedCollections = {
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Banner with Overlaid Cards */}
        <section className="relative bg-background">
          <div className="container pt-6 pb-4">
            <HeroCarousel />
          </div>
          
          {/* Overlaid Category Cards */}
          <div className="container relative -mt-32 md:-mt-36 pb-12 z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category) => (
                <Link key={category.name} to="/products">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card border-border/50 shadow-md">
                    <div className="h-32 bg-card flex items-center justify-center">
                      <category.icon className={`h-12 w-12 ${category.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    <div className="p-4 border-t border-border/30">
                      <h3 className="font-semibold text-sm text-center">{category.name}</h3>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="container py-8">
          <Link to="/products">
            <Card className="overflow-hidden bg-muted/30 hover:shadow-md transition-all duration-300 cursor-pointer group border-border/50">
              <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <Badge className="mb-3 bg-sale text-white">Limited Time Offer</Badge>
                  <h3 className="text-2xl md:text-3xl font-display font-bold mb-2">
                    Up to 50% off on Selected Items
                  </h3>
                  <p className="text-muted-foreground text-base">
                    Don't miss out on amazing deals across all categories
                  </p>
                </div>
                <Button size="lg" className="shadow-sm group-hover:shadow-md transition-all duration-300">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </Link>
        </section>

        {/* Today's Deals */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Today's Deals</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See all deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {specialDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* View Mode Toggle Section */}
        <section className="container py-8">
          <div className="bg-muted/30 rounded-lg p-8 border border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Explore Products Your Way</h2>
                <p className="text-muted-foreground text-base">Choose how you'd like to browse</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setViewMode("standard")}
                  variant={viewMode === "standard" ? "default" : "outline"}
                >
                  Standard View
                </Button>
                <Button
                  onClick={() => setViewMode("cuisine")}
                  variant={viewMode === "cuisine" ? "default" : "outline"}
                >
                  Cuisine Explorer
                </Button>
                <Button
                  onClick={() => setViewMode("curated")}
                  variant={viewMode === "curated" ? "default" : "outline"}
                >
                  Curated Collections
                </Button>
              </div>
            </div>

            {/* Standard View */}
            {viewMode === "standard" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Best Sellers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bestSellers.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cuisine Explorer View */}
            {viewMode === "cuisine" && (
              <div className="space-y-8">
                {Object.entries(cuisineGroups).map(([cuisineName, cuisineProducts]) => (
                  <div key={cuisineName}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{cuisineName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {cuisineProducts.map((product) => (
                          <div key={product.id} className="flex-none w-[200px]">
                            <ProductCard product={product} />
                          </div>
                        ))}
                        <Link to="/products" className="flex-none w-[200px]">
                          <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <ChevronRight className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">View All</span>
                          </div>
                        </Link>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                ))}
              </div>
            )}

            {/* Curated Collections View */}
            {viewMode === "curated" && (
              <div className="space-y-8">
                {Object.entries(curatedCollections).map(([collectionName, collectionProducts]) => (
                  <div key={collectionName}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{collectionName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {collectionProducts.map((product) => (
                          <div key={product.id} className="flex-none w-[200px]">
                            <ProductCard product={product} />
                          </div>
                        ))}
                        <Link to="/products" className="flex-none w-[200px]">
                          <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <ChevronRight className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">View All</span>
                          </div>
                        </Link>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="container py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {recentlyViewed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Staples & Grains */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Staples & Grains</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {staples.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Snacks */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Snacks & Treats</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {snacks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Beverages */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Beverages</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {beverages.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Instant Food */}
        <section className="container py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Quick & Easy Meals</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {instantFood.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
