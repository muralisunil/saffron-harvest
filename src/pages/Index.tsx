import { Link } from "react-router-dom";
import { Award, Tag, ShoppingBag, ArrowRight, Star, Package, Truck, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { products } from "@/data/products";

type ViewMode = "standard" | "cuisine" | "curated";

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);
  const specialDeals = products.filter((p) => p.discount).slice(0, 4);
  
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
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          
          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="container relative z-10 py-20"
          >
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight leading-none">
                  Authentic flavors.
                  <br />
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Modern convenience.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Experience the finest selection of Indian groceries delivered fresh to your door
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/products">
                  <Button size="lg" className="group px-8 py-6 text-lg">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                    Browse Products
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span>1000+ Products</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Fast Delivery</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span>100% Authentic</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating decorative elements */}
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </section>

        {/* Stats Section */}
        <section className="container py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "1000+", label: "Products", icon: Package },
              { number: "100%", label: "Authentic", icon: Award },
              { number: "24/7", label: "Support", icon: ShoppingBag },
              { number: "5★", label: "Rated", icon: Star }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center space-y-3"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Product Discovery Section with View Toggles */}
        <section className="container py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                Discover your favorites
              </h2>
              <p className="text-xl text-muted-foreground">
                Explore our products in the way that suits you best
              </p>
              
              {/* View Toggle Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button
                  onClick={() => setViewMode("standard")}
                  variant={viewMode === "standard" ? "default" : "outline"}
                  size="lg"
                  className="px-8"
                >
                  Standard
                </Button>
                <Button
                  onClick={() => setViewMode("cuisine")}
                  variant={viewMode === "cuisine" ? "default" : "outline"}
                  size="lg"
                  className="px-8"
                >
                  Cuisine Explorer
                </Button>
                <Button
                  onClick={() => setViewMode("curated")}
                  variant={viewMode === "curated" ? "default" : "outline"}
                  size="lg"
                  className="px-8"
                >
                  Curated Collections
                </Button>
              </div>
            </div>

            {/* Standard View */}
            {viewMode === "standard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
              >
                <div className="space-y-8">
                  <h3 className="text-3xl font-display font-bold">Customer favorites</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {bestSellers.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -8 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Link to="/products">
                    <Button size="lg" variant="outline" className="group px-8">
                      View All Products
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Cuisine Explorer View */}
            {viewMode === "cuisine" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                {Object.entries(cuisineGroups).map(([cuisineName, cuisineProducts], groupIndex) => (
                  <div key={cuisineName} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-display font-bold">{cuisineName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    
                    <ScrollArea className="w-full">
                      <div className="flex gap-6 pb-4">
                        {cuisineProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: groupIndex * 0.1 + index * 0.05 }}
                            className="flex-none w-[200px]"
                            whileHover={{ y: -8 }}
                          >
                            <ProductCard product={product} />
                          </motion.div>
                        ))}
                        
                        {/* View All Card */}
                        <Link to="/products" className="flex-none w-[200px]">
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: groupIndex * 0.1 + cuisineProducts.length * 0.05 }}
                            className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors group cursor-pointer"
                            whileHover={{ y: -8 }}
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <ChevronRight className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">View All</span>
                          </motion.div>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                {Object.entries(curatedCollections).map(([collectionName, collectionProducts], groupIndex) => (
                  <div key={collectionName} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-display font-bold">{collectionName}</h3>
                      <Link to="/products">
                        <Button variant="ghost" size="sm" className="group">
                          View All
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                    
                    <ScrollArea className="w-full">
                      <div className="flex gap-6 pb-4">
                        {collectionProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: groupIndex * 0.1 + index * 0.05 }}
                            className="flex-none w-[200px]"
                            whileHover={{ y: -8 }}
                          >
                            <ProductCard product={product} />
                          </motion.div>
                        ))}
                        
                        {/* View All Card */}
                        <Link to="/products" className="flex-none w-[200px]">
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: groupIndex * 0.1 + collectionProducts.length * 0.05 }}
                            className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors group cursor-pointer"
                            whileHover={{ y: -8 }}
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <ChevronRight className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">View All</span>
                          </motion.div>
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

        {/* Features Grid */}
        <section className="container py-32">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingBag,
                title: "Wide Selection",
                description: "Over 1000 authentic products from the best Indian brands",
                color: "primary"
              },
              {
                icon: Award,
                title: "Quality Assured",
                description: "Every product verified for authenticity and freshness",
                color: "secondary"
              },
              {
                icon: Tag,
                title: "Best Prices",
                description: "Competitive pricing with regular deals and discounts",
                color: "accent"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-${feature.color}/10 mb-6`}>
                  <feature.icon className={`h-7 w-7 text-${feature.color}`} />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Special Deals Section */}
        <section className="relative overflow-hidden py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-sale/10 via-transparent to-transparent" />
          
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="space-y-16"
            >
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-sale/10 text-sale mb-4">
                  <Tag className="h-5 w-5" />
                  <span className="text-sm font-medium">Limited Time Offers</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                  Special deals
                </h2>
                <p className="text-xl text-muted-foreground">
                  Save big on your favorite products
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {specialDeals.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <Link to="/products">
                  <Button size="lg" className="bg-sale hover:bg-sale/90 group px-8">
                    Shop All Deals
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-secondary p-16 md:p-24 text-center"
          >
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground leading-tight">
                Ready to experience authentic Indian flavors?
              </h2>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                Join thousands of satisfied customers and start your culinary journey today
              </p>
              <Link to="/products">
                <Button size="lg" variant="secondary" className="group px-10 py-6 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
