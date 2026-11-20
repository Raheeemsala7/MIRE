import type { Customer, CustomerMetricsData } from "../types/customer.types";

export function formatCustomerDate(
  dateStr?: string | null,
  locale: string = "ar"
): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatCustomerCurrency(
  amount?: number | null,
  locale: string = "ar"
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return locale === "ar" ? "0 ج.م" : "EGP 0";
  }
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  return locale === "ar" ? `${formatted} ج.م` : `EGP ${formatted}`;
}

export function calculateCustomerMetrics(
  customers: Customer[] = [],
  pagination?: { total?: number; totalPages?: number; page?: number }
): CustomerMetricsData {
  const totalCount = pagination?.total !== undefined ? pagination.total : customers.length;
  const totalPages = pagination?.totalPages ?? (customers.length > 0 ? 1 : 0);
  const currentPage = pagination?.page ?? 1;
  const pageCount = customers.length;

  // Real aggregations on current loaded view
  const withOrdersInView = customers.filter((c) => (c.totalOrders ?? 0) > 0).length;
  const totalSpentInView = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

  return {
    total: totalCount,
    totalPages,
    currentPage,
    pageCount,
    withOrdersInView,
    totalSpentInView,
  };
}

export function getOrderStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
      return "default";
    case "PROCESSING":
    case "CONFIRMED":
    case "READY_TO_SHIP":
    case "SHIPPED":
      return "secondary";
    case "CANCELLED":
    case "RETURNED":
    case "FAILED_DELIVERY":
    case "CUSTOMER_NOT_RESPONDING":
      return "destructive";
    case "NEW":
    default:
      return "outline";
  }
}

export function getPaymentStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "default";
    case "PENDING":
      return "secondary";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    default:
      return "outline";
  }
}
