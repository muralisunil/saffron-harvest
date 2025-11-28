import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const baseVariant = product.variants[0];
  const displayPrice = product.discount 
    ? baseVariant.price 
    : baseVariant.price;

  return (
    <Card className="group overflow-hidden hover:shadow-elevated transition-all duration-300">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
          {product.isBestSeller && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground shadow-gold">
              <Award className="h-3 w-3 mr-1" />
              Best Seller
            </Badge>
          )}
          {product.discount && (
            <Badge className="absolute top-3 right-3 bg-sale text-sale-foreground">
              {product.discount}% OFF
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="space-y-2">
          <Link to={`/product/${product.id}`}>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
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

          <Button
            onClick={(e) => {
              e.preventDefault();
              addItem(product, baseVariant);
            }}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
