export interface OrderItem {
  id?: string;
  name: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
}

export interface OrderDisplay {
  _id?: string;
  orderNumber: string;
  createdAt?: string;
  status: string;
  pricing: {
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  };
  paymentInfo?: {
    method: string;
    status: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    governorate: string;
    building?: string;
    apartment?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  customerInfo?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
}
