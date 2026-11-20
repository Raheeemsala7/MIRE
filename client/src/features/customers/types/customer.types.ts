export interface CustomerAddress {
  _id?: string;
  street: string;
  building?: string;
  apartment?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country?: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface CustomerSocialProfiles {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
}

export interface Customer {
  _id: string;
  user?: string | { _id: string; name?: string; email?: string } | null;
  fullName: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  addresses: CustomerAddress[];
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  notes: string;
  socialProfiles?: CustomerSocialProfiles;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecentOrder {
  _id: string;
  orderNumber: string;
  customer?: string;
  status: string;
  pricing: {
    subtotal: number;
    shippingFee?: number;
    bundleDiscount?: number;
    couponDiscount?: number;
    totalAmount: number;
  };
  paymentInfo?: {
    method?: string;
    status?: string;
    transactionId?: string;
    paidAt?: string;
  };
  createdAt: string;
}

export interface CustomerDetailsData {
  customer: Customer;
  recentOrders: CustomerRecentOrder[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomersPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Customer[];
  meta: PaginationMeta;
}

export interface CustomerDetailsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CustomerDetailsData;
}

export interface SingleCustomerResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Customer;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface UpdateCustomerPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  tags?: string[];
  notes?: string;
  socialProfiles?: CustomerSocialProfiles;
  addresses?: CustomerAddress[];
}

export interface CustomerMetricsData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageCount: number;
  withOrdersInView: number;
  totalSpentInView: number;
}
