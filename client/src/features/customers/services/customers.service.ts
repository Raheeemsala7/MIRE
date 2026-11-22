import type {
  CustomerFilters,
  CustomersPaginatedResponse,
  CustomerDetailsResponse,
} from "../types/customer.types";
import { handleClientSessionExpired } from "@/shared/lib/utils/client-auth.utils";

export async function fetchCustomers(
  filters: CustomerFilters = {}
): Promise<CustomersPaginatedResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search && filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.sortBy) params.set("sortBy", filters.sortBy);

  const query = params.toString();
  const url = `/api/admin/customers${query ? `?${query}` : ""}`;

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
        `Failed to fetch customers (${res.status})`
    );
  }

  return res.json() as Promise<CustomersPaginatedResponse>;
}

export async function fetchCustomerById(
  id: string
): Promise<CustomerDetailsResponse> {
  const res = await fetch(`/api/admin/customers/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Failed to fetch customer details (${res.status})`
    );
  }

  return res.json() as Promise<CustomerDetailsResponse>;
}
