import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Tag, Sparkles, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { products } from "@/data/products";

const Index = () => {
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 8);
  const specialDeals = products.filter((p) => p.discount).slice(0, 8);
  const staples = products.filter(p => p.category === "Staples").slice(0, 4);
  const snacks = products.filter(p => p.category === "Snacks").slice(0, 4);
  const beverages = products.filter(p => p.category === "Beverages").slice(0, 4);
  const instantFood = products.filter(p => p.category === "Instant Food").slice(0, 4);
  
  const categories = [
    { name: "Staples & Grains", icon: Package, products: staples, color: "from-amber-500/20 to-orange-500/20" },
    { name: "Snacks", icon: ShoppingBag, products: snacks, color: "from-red-500/20 to-pink-500/20" },
    { name: "Beverages", icon: Sparkles, products: beverages, color: "from-blue-500/20 to-cyan-500/20" },
    { name: "Instant Food", icon: Tag, products: instantFood, color: "from-green-500/20 to-emerald-500/20" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Carousel */}
        <section className="bg-muted/30">
          <div className="container py-4">
            <HeroCarousel />
          </div>
        </section>

        {/* Category Cards */}
        <section className="container py-8">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.name} to="/products">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <category.icon className="h-16 w-16 text-foreground/60 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's Deals */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Today's Deals</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                See all deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {specialDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Best Sellers</h2>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

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
