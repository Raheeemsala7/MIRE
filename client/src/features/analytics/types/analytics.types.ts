export type AnalyticsRange = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface AnalyticsFilter {
  range: AnalyticsRange;
  startDate?: string;
  endDate?: string;
}

export interface DashboardOverview {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  newOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  returnRate: string;
  deliverySuccessRate: string;
}

export interface DailyRevenueItem {
  _id: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface OrderStatusItem {
  status: string;
  count: number;
}

export interface CategorySalesItem {
  category: string;
  revenue: number;
  count: number;
}

export interface BestSellerItem {
  _id: string;
  name: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
}

export interface PaymentDistributionItem {
  method: string;
  count: number;
  revenue: number;
}

export interface DashboardCharts {
  dailyRevenue: DailyRevenueItem[];
  ordersByStatus: OrderStatusItem[];
  salesByCategory: CategorySalesItem[];
  bestSellers: BestSellerItem[];
  paymentDistribution: PaymentDistributionItem[];
}

export interface AnalyticsDashboardData {
  overview: DashboardOverview;
  charts: DashboardCharts;
}

export interface RecentOrderItem {
  _id: string;
  orderNumber: string;
  customerInfo: {
    fullName: string;
    phone?: string;
    email?: string;
  };
  pricing: {
    subtotal: number;
    shippingFee: number;
    discount?: number;
    totalAmount: number;
  };
  paymentInfo: {
    method: string;
    status: string;
  };
  status: string;
  createdAt: string;
  itemsCount: number;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  variantSku: string;
  color: string;
  size: string;
  stockQuantity: number;
  threshold: number;
}

export interface DashboardCompositeData {
  analytics?: AnalyticsDashboardData;
  recentOrders?: RecentOrderItem[];
  lowStockItems?: LowStockItem[];
}
