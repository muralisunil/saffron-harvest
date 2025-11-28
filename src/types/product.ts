export interface ProductVariant {
  id: string;
  size: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  isBestSeller?: boolean;
  discount?: number;
  originalPrice?: number;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface OrderDetails {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  orderDate: Date;
}
