// Interface for product data structure
export interface Product {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: {
    price: string;
    value?: number;
    type: string;
    min: string;
    max: string;
    denominations?: string[];
    currency: {
      code: string;
      symbol: string;
      numericCode: string;
    } | string;
  };
  images: {
    thumbnail: string;
    mobile: string;
    base: string;
    small: string;
  };
  currency: string;
  url: string;
}

// Interface for order card data
export interface OrderCard {
  sku: string;
  productName: string;
  amount: number;
  cardNumber: string;
  cardPin: string;
  validity: string;
  issuanceDate: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  balance: number | null;
  status?: string;
}

// Interface for cart item
export interface CartItem {
  sku: string;
  name: string;
  image: string;
  denomination: string;
  currency: string;
  quantity: number;
  price: number;
}

// Interface for Razorpay options
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
} 