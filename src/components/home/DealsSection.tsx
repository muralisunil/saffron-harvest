import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Flame } from "lucide-react";
import { useCart } from "@/context/CartContext";
import DealCountdown from "@/components/DealCountdown";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface DealsSectionProps {
  dealProducts: Product[];
  onQuickView: (product: Product) => void;
  isLoading?: boolean;
}

// Create end times for deals (staggered throughout the day)
const getDealEndTime = (index: number) => {
  const now = new Date();
  const hours = [2, 5, 8, 12][index] || 4;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
};

const DealsSection = ({ dealProducts, onQuickView, isLoading }: DealsSectionProps) => {
  const { addItem } = useCart();

  if (!isLoading && dealProducts.length === 0) return null;

  const DealSkeleton = () => (
    <Card className="overflow-hidden border-2 border-primary/20">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <section className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-8"
      >
        <Flame className="h-7 w-7 text-primary" />
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Today's Hot Deals
        </h2>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <DealSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden bg-card border-2 border-primary/20 shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-2">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <Badge className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-red-500 text-white border-0 text-sm font-bold px-3 py-1">
                    {product.discount}% OFF
                  </Badge>

                  {/* Quick View Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={() => onQuickView(product)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Quick View
                  </Button>
                </div>

                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">{product.brand}</p>
                      <h3 className="font-semibold text-base leading-snug line-clamp-2 mt-1 text-foreground">
                        {product.name}
                      </h3>
                    </div>

                    {/* Countdown Timer */}
                    <DealCountdown endTime={getDealEndTime(index)} />

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        ₹{product.variants[0]?.price || 0}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => product.variants[0] && addItem(product, product.variants[0])}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="sm"
                      disabled={!product.variants[0]}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DealsSection;
