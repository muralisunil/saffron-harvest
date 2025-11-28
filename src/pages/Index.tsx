import { Link } from "react-router-dom";
import { Award, Tag, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";

const Index = () => {
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);
  const specialDeals = products.filter((p) => p.discount).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-8">
          <HeroCarousel />
        </section>

        {/* Features */}
        <section className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary-glow/5 border border-primary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Wide Selection</h3>
                <p className="text-sm text-muted-foreground">
                  1000+ authentic products
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Quality Assured</h3>
                <p className="text-sm text-muted-foreground">
                  100% authentic brands
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Tag className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Best Prices</h3>
                <p className="text-sm text-muted-foreground">
                  Great deals daily
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2">
                Best Sellers
              </h2>
              <p className="text-muted-foreground">
                Most loved products by our customers
              </p>
            </div>
            <Link to="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Special Deals */}
        <section className="container py-12 bg-gradient-to-br from-sale/5 to-transparent rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
                <Tag className="h-8 w-8 text-sale" />
                Special Deals
              </h2>
              <p className="text-muted-foreground">
                Limited time offers on your favorite products
              </p>
            </div>
            <Link to="/products">
              <Button className="bg-sale hover:bg-sale/90">Shop Deals</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specialDeals.map((product) => (
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
