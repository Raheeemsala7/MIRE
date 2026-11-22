export type PaymentMethod = "COD" | "PAYMOB" | "STRIPE";

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
  secondaryPhone?: string;
}

export interface ShippingAddressInput {
  street: string;
  building?: string;
  apartment?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckoutPayload {
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethod;
  orderNotes?: string;
  guestId?: string;
  items?: Array<{
    id?: string;
    productId?: string;
    variantSku?: string;
    sku?: string;
    title?: string;
    name?: string;
    color?: string;
    size?: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
  }>;
}

export interface PlacedOrder {
  _id?: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddressInput;
  paymentInfo: {
    method: PaymentMethod;
    status: string;
  };
  pricing: {
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  };
  items: Array<{
    name: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  status: string;
  createdAt?: string;
}
