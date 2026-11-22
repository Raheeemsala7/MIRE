import type {
  ReturnsFilterParams,
  ReturnsPaginatedResponse,
  SingleReturnResponse,
  ReturnsOverviewStats,
} from "../types/return.types";
import { handleClientSessionExpired } from "@/shared/lib/utils/client-auth.utils";

export interface DeliveredOrderSummary {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: Array<{
    product: string;
    name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  pricing: {
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  };
}

export async function fetchReturns(
  filters: ReturnsFilterParams = {}
): Promise<ReturnsPaginatedResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.search && filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.assignedEmployee) params.set("assignedEmployee", filters.assignedEmployee);
  if (filters.sort) params.set("sort", filters.sort);

  const query = params.toString();
  const url = `/api/admin/returns${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch returns (${res.status})`
    );
  }

  return res.json() as Promise<ReturnsPaginatedResponse>;
}

export async function fetchReturnById(id: string): Promise<SingleReturnResponse> {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch return details (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function fetchCustomerDeliveredOrders(): Promise<{
  success: boolean;
  data: DeliveredOrderSummary[];
}> {
  const res = await fetch("/api/customer/orders/delivered", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch customer orders (${res.status})`
    );
  }

  return res.json() as Promise<{
    success: boolean;
    data: DeliveredOrderSummary[];
  }>;
}

export async function fetchReturnsStats(): Promise<{
  success: boolean;
  data: ReturnsOverviewStats;
}> {
  const res = await fetch("/api/admin/returns/stats", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch returns statistics (${res.status})`
    );
  }

  return res.json() as Promise<{
    success: boolean;
    data: ReturnsOverviewStats;
  }>;
}

