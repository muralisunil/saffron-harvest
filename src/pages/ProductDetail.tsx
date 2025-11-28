import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import { ProductVariant } from "@/types/product";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product?.variants[0]!
  );
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <Link to="/products">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
            {product.isBestSeller && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground shadow-gold">
                <Award className="h-4 w-4 mr-1" />
                Best Seller
              </Badge>
            )}
            {product.discount && (
              <Badge className="absolute top-4 right-4 bg-sale text-sale-foreground text-lg px-4 py-2">
                {product.discount}% OFF
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
              <h1 className="text-3xl font-display font-bold mb-2">
                {product.name}
              </h1>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                ₹{selectedVariant.price}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.originalPrice}
                </span>
              )}
              {product.discount && (
                <Badge variant="outline" className="text-sale border-sale">
                  Save {product.discount}%
                </Badge>
              )}
            </div>

            {/* Variant Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Size</Label>
              <RadioGroup
                value={selectedVariant.id}
                onValueChange={(value) => {
                  const variant = product.variants.find((v) => v.id === value);
                  if (variant) setSelectedVariant(variant);
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="relative">
                      <RadioGroupItem
                        value={variant.id}
                        id={variant.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={variant.id}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="text-sm font-semibold">
                          {variant.size}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ₹{variant.price}
                        </span>
                        {variant.stock < 10 && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Only {variant.stock} left
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(Math.min(selectedVariant.stock, quantity + 1))
                  }
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedVariant.stock} available
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full"
              disabled={selectedVariant.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {selectedVariant.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            {/* Product Info */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{product.brand}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock Status</span>
                <Badge variant={selectedVariant.stock > 0 ? "default" : "destructive"}>
                  {selectedVariant.stock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
