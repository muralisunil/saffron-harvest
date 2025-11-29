import { Link } from "react-router-dom";
import { Award, Tag, ShoppingBag, TrendingUp, Clock, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";

const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

const Index = () => {
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);
  const specialDeals = products.filter((p) => p.discount).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="container py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
                  Authentic Indian groceries.{" "}
                  <span className="text-primary">Delivered fresh.</span>
                </h1>
                <ul className="space-y-3 mb-8 text-lg text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Premium quality spices & ingredients
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-secondary" />
                    Same-day delivery available
                  </li>
                  <li className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Best prices guaranteed
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-sale" />
                    100% authentic products
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/products">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                      Shop Now
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                      Browse Categories
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <HeroCarousel />
              </motion.div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />
        </section>

        {/* Features */}
        <AnimatedSection>
          <section className="container py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/5 border border-primary/20"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">Wide Selection</h3>
                  <p className="text-muted-foreground">
                    1000+ authentic Indian products from trusted brands
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20"
              >
                <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <Award className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">Quality Assured</h3>
                  <p className="text-muted-foreground">
                    100% authentic brands with freshness guarantee
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20"
              >
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">Best Prices</h3>
                  <p className="text-muted-foreground">
                    Competitive prices with daily deals and offers
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Best Sellers */}
        <AnimatedSection delay={0.2}>
          <section className="container py-20">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-display font-bold mb-4"
              >
                Customer Favorites
              </motion.h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Most loved products by our community
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {bestSellers.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/products">
                <Button size="lg" variant="outline" className="px-8">
                  View All Products
                </Button>
              </Link>
            </div>
          </section>
        </AnimatedSection>

        {/* Special Deals */}
        <AnimatedSection delay={0.3}>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sale/10 via-sale/5 to-transparent" />
            <div className="container py-20 relative">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-3 mb-4"
                >
                  <Tag className="h-10 w-10 text-sale" />
                  <h2 className="text-4xl md:text-5xl font-display font-bold">
                    Limited Time Offers
                  </h2>
                </motion.div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Don't miss out on these amazing deals
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {specialDeals.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <Link to="/products">
                  <Button size="lg" className="bg-sale hover:bg-sale/90 px-8">
                    Shop All Deals
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sale/10 rounded-full blur-3xl -z-10" />
          </section>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection delay={0.4}>
          <section className="container py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-secondary p-12 md:p-16 text-center"
            >
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
                  Start Shopping Today
                </h2>
                <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                  Experience the finest selection of authentic Indian groceries delivered to your doorstep
                </p>
                <Link to="/products">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-10"
                  >
                    Browse Products
                  </Button>
                </Link>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </motion.div>
          </section>
        </AnimatedSection>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
