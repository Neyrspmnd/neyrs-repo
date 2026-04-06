export interface Product {
  id: string;
  title: string;
  description: string;
  price: ProductPrice;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  url: string;
}

export interface ProductPrice {
  amount: number;
  currency: string;
  usdcEquivalent: number;
}

export interface ProductSearchResult {
  products: Product[];
  totalResults: number;
  query: string;
  processingTimeMs: number;
}

export interface PurchaseRequest {
  productId: string;
  quantity: number;
  paymentMethod: 'USDC';
  shippingAddress: ShippingAddress;
  walletAddress: string;
}

export interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PurchaseResult {
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  transactionSignature?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}
