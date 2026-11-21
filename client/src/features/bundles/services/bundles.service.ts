import type {
  BundleFilters,
  BundlesPaginatedResponse,
  SingleBundleResponse,
} from "../types/bundle.types";
import { buildBundleQueryParams } from "../utils/bundle.util";

/**
 * Fetch bundles via client Route Handler /api/admin/bundles
 */
export async function fetchAdminBundles(
  filters: BundleFilters = {}
): Promise<BundlesPaginatedResponse> {
  const query = buildBundleQueryParams(filters);
  const url = `/api/admin/bundles${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error || errorBody?.message || `Failed to fetch bundles (${res.status})`
    );
  }

  return res.json() as Promise<BundlesPaginatedResponse>;
}

/**
 * Fetch bundle by ID
 */
export async function fetchAdminBundleById(
  id: string
): Promise<SingleBundleResponse> {
  const cleanId = encodeURIComponent(id.trim());
  const res = await fetch(`/api/admin/bundles/${cleanId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error || errorBody?.message || `Failed to fetch bundle (${res.status})`
    );
  }

  return res.json() as Promise<SingleBundleResponse>;
}
