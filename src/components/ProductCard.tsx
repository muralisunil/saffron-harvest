import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Award, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import AddToListButton from "./AddToListButton";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const baseVariant = product.variants[0];
  const displayPrice = product.discount 
    ? baseVariant.price 
    : baseVariant.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      <Card className="group overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-2">
        <Link to={`/product/${product.id}`}>
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
              <AddToListButton productId={product.id} variantId={baseVariant.id} variant="icon" />
            </div>
            
            {product.isBestSeller && (
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                <Award className="h-3 w-3 mr-1" />
                Best Seller
              </Badge>
            )}
            
            {product.discount && (
              <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-rose-500 to-red-500 text-white border-0 shadow-lg text-sm font-bold px-3">
                {product.discount}% OFF
              </Badge>
            )}
          </div>
        </Link>

        <CardContent className="p-5">
          <div className="space-y-3">
            <Link to={`/product/${product.id}`} className="block">
              <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">{product.brand}</p>
              <h3 className="font-semibold text-base leading-snug line-clamp-2 mt-1 text-foreground group-hover:text-primary transition-colors duration-300">
                {product.name}
              </h3>
            </Link>

            {/* Rating placeholder - adds visual interest */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">(128)</span>
            </div>

            <div className="flex items-end justify-between pt-1">
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground">
                    ₹{displayPrice}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{baseVariant.size}</p>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.preventDefault();
                addItem(product, baseVariant);
              }}
              className="w-full mt-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
