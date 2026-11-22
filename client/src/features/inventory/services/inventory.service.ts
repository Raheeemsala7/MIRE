import type {
  InventoryMovementsFilterParams,
  InventoryMovementsPaginatedResponse,
  LowStockPaginatedResponse,
} from "../types/inventory.types";
import { buildMovementsQueryParams } from "../utils/inventory.util";
import { handleClientSessionExpired } from "@/shared/lib/utils/client-auth.utils";

/**
 * Fetch paginated inventory movements via client Route Handler
 */
export async function fetchInventoryMovements(
  filters: InventoryMovementsFilterParams = {}
): Promise<InventoryMovementsPaginatedResponse> {
  const query = buildMovementsQueryParams(filters);
  const url = `/api/admin/inventory/movements${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error ||
        errorBody?.message ||
        `Failed to fetch inventory movements (${res.status})`
    );
  }

  return res.json() as Promise<InventoryMovementsPaginatedResponse>;
}

/**
 * Fetch low stock alerts via client Route Handler
 */
export async function fetchLowStockAlerts(
  filters: { page?: number; limit?: number } = {}
): Promise<LowStockPaginatedResponse> {
  const query = new URLSearchParams();
  if (filters.page) query.set("page", String(filters.page));
  if (filters.limit) query.set("limit", String(filters.limit));
  query.set("paginated", "true");

  const url = `/api/admin/inventory/low-stock?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) handleClientSessionExpired();
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error ||
        errorBody?.message ||
        `Failed to fetch low stock alerts (${res.status})`
    );
  }

  return res.json() as Promise<LowStockPaginatedResponse>;
}
