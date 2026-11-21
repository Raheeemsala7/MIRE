import type {
  ProductFilters,
  ProductsPaginatedResponse,
  SingleProductResponse,
} from "../types/product.types";
import { buildProductQueryParams } from "../utils/product.util";

/**
 * Fetch products via client Route Handler /api/admin/products
 */
export async function fetchAdminProducts(
  filters: ProductFilters = {}
): Promise<ProductsPaginatedResponse> {
  const query = buildProductQueryParams(filters);
  const url = `/api/admin/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error || errorBody?.message || `Failed to fetch products (${res.status})`
    );
  }

  return res.json() as Promise<ProductsPaginatedResponse>;
}

/**
 * Fetch product by ID via client Route Handler
 */
export async function fetchAdminProductById(
  id: string
): Promise<SingleProductResponse> {
  const cleanId = encodeURIComponent(id.trim());
  const res = await fetch(`/api/admin/products/${cleanId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      errorBody?.error || errorBody?.message || `Failed to fetch product (${res.status})`
    );
  }

  return res.json() as Promise<SingleProductResponse>;
}
