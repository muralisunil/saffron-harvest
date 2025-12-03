import { Product, ProductVariant } from "@/types/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Award, Star, Plus, Minus, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import AddToListButton from "./AddToListButton";
import { useState } from "react";
import { Link } from "react-router-dom";

interface QuickViewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewModal = ({ product, open, onOpenChange }: QuickViewModalProps) => {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const variant = selectedVariant || product.variants[0];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, variant);
    }
    onOpenChange(false);
    setQuantity(1);
    setSelectedVariant(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative aspect-square bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
            {product.isBestSeller && (
              <Badge className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Award className="h-3 w-3 mr-1" />
                Best Seller
              </Badge>
            )}
            {product.discount && (
              <Badge className="absolute bottom-4 left-4 bg-gradient-to-r from-rose-500 to-red-500 text-white border-0 text-sm font-bold px-3">
                {product.discount}% OFF
              </Badge>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="text-left mb-4">
              <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">{product.brand}</p>
              <DialogTitle className="text-2xl font-display">{product.name}</DialogTitle>
            </DialogHeader>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
              <span className="text-sm text-muted-foreground ml-2">(128 reviews)</span>
            </div>

            <p className="text-muted-foreground text-sm mb-6">{product.description}</p>

            {/* Variant Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      variant.id === v.id
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">₹{variant.price * quantity}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{product.originalPrice * quantity}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <AddToListButton productId={product.id} variantId={variant.id} variant="icon" />
            </div>

            <Link 
              to={`/product/${product.id}`}
              className="text-center text-sm text-primary hover:underline mt-4"
              onClick={() => onOpenChange(false)}
            >
              View Full Details
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
