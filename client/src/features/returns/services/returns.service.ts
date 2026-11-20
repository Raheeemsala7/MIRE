import type {
  ReturnsFilterParams,
  ReturnsPaginatedResponse,
  SingleReturnResponse,
  UpdateReturnStatusPayload,
  InspectReturnPayload,
  LogCallAttemptPayload,
  AssignReturnPayload,
  RequestReturnPayload,
  ReturnsOverviewStats,
} from "../types/return.types";

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
    cache: "no-store",
  });

  if (!res.ok) {
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
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch return details (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function updateReturnStatus(
  id: string,
  payload: UpdateReturnStatusPayload
): Promise<SingleReturnResponse> {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to update return status (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function inspectReturn(
  id: string,
  payload: InspectReturnPayload
): Promise<SingleReturnResponse> {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to inspect return (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function logReturnCallAttempt(
  id: string,
  payload: LogCallAttemptPayload
): Promise<SingleReturnResponse> {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}/call-attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to log call attempt (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function assignReturn(
  id: string,
  payload: AssignReturnPayload
): Promise<SingleReturnResponse> {
  const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to assign return (${res.status})`
    );
  }

  return res.json() as Promise<SingleReturnResponse>;
}

export async function submitReturnRequest(
  payload: RequestReturnPayload
): Promise<SingleReturnResponse> {
  const res = await fetch("/api/returns/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to submit return request (${res.status})`
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
    cache: "no-store",
  });

  if (!res.ok) {
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
    cache: "no-store",
  });

  if (!res.ok) {
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

