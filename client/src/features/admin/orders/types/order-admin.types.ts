export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "CUSTOMER_NOT_RESPONDING"
  | "FAILED_DELIVERY";

export type PaymentMethod = "COD" | "STRIPE" | "PAYMOB";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface OrderItem {
  _id?: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    _id: string;
    images?: Array<{ url: string }>;
  };
}

export interface OrderAddress {
  street: string;
  building?: string;
  apartment?: string;
  city: string;
  governorate: string;
  country: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
  secondaryPhone?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  reason?: string;
  timestamp: string;
  changedBy?: {
    name?: string;
    role?: string;
  };
}

export interface OrderDoc {
  _id: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  shippingAddress: OrderAddress;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    bundleDiscount?: number;
    couponDiscount?: number;
    shippingFee: number;
    totalAmount: number;
  };
  paymentInfo: {
    method: PaymentMethod;
    status: PaymentStatus;
  };
  status: OrderStatus;
  orderNotes?: string;
  assignedEmployee?: {
    name: string;
    email: string;
    role: string;
  };
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrdersPaginatedResponse {
  success: boolean;
  data: OrderDoc[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderStatusConfig {
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  dotColor: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  NEW: {
    labelAr: "طلب جديد",
    labelEn: "New Order",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  CONFIRMED: {
    labelAr: "تم التأكيد",
    labelEn: "Confirmed",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    dotColor: "bg-indigo-500",
  },
  PROCESSING: {
    labelAr: "تم التجهيز / جاري التجهيز",
    labelEn: "Processing",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  READY_TO_SHIP: {
    labelAr: "جاهز للشحن",
    labelEn: "Ready to Ship",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
  },
  SHIPPED: {
    labelAr: "تم الشحن / خرج للتوصيل",
    labelEn: "Shipped",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    dotColor: "bg-cyan-500",
  },
  DELIVERED: {
    labelAr: "تم التوصيل بنجاح",
    labelEn: "Delivered",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  CANCELLED: {
    labelAr: "ملغي",
    labelEn: "Cancelled",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
  RETURNED: {
    labelAr: "مرتجع",
    labelEn: "Returned",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    dotColor: "bg-orange-500",
  },
  CUSTOMER_NOT_RESPONDING: {
    labelAr: "العميل لا يرد",
    labelEn: "No Answer",
    badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    dotColor: "bg-yellow-500",
  },
  FAILED_DELIVERY: {
    labelAr: "فشل التوصيل",
    labelEn: "Delivery Failed",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
};
