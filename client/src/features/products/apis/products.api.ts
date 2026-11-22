import "server-only";

import { serverApiGet } from "@/lib/auth/session";
import { apiUrl, BackendApiError } from "@/lib/auth/backend-client";
import { buildProductQueryParams } from "../utils/product.util";
import type {
  ProductFilters,
  ProductsPaginatedResponse,
  SingleProductResponse,
  ProductOverviewStats,
  CategoriesResponse,
  CategoryItem,
  Product,
} from "../types/product.types";

/**
 * Admin: Fetch paginated products with full backend filters
 */
export async function getAdminProducts(
  filters: ProductFilters = {}
): Promise<ProductsPaginatedResponse> {
  const query = buildProductQueryParams({ ...filters, admin: true });
  const path = `/products${query ? `?${query}` : ""}` as `/${string}`;
  return serverApiGet<ProductsPaginatedResponse>(path);
}

/**
 * Admin: Fetch single product by ID
 */
export async function getAdminProductById(id: string): Promise<SingleProductResponse> {
  const cleanId = encodeURIComponent(id.trim());
  return serverApiGet<SingleProductResponse>(`/products/${cleanId}` as `/${string}`);
}

/**
 * Admin: Fetch real overview aggregate stats using actual backend responses
 */
export async function getAdminProductOverviewStats(): Promise<ProductOverviewStats> {
  try {
    const [allRes, activeRes, archivedRes, lowStockRes] = await Promise.all([
      serverApiGet<ProductsPaginatedResponse>("/products?limit=1&admin=true"),
      serverApiGet<ProductsPaginatedResponse>("/products?limit=1&status=ACTIVE&admin=true"),
      serverApiGet<ProductsPaginatedResponse>("/products?limit=1&status=ARCHIVED&admin=true"),
      serverApiGet<{ success: boolean; data: unknown[] }>("/inventory/low-stock").catch(() => null),
    ]);

    const totalProducts = allRes?.meta?.total ?? 0;
    const activeProducts = activeRes?.meta?.total ?? 0;
    const archivedProducts = archivedRes?.meta?.total ?? 0;
    const rawInventoryItems = Array.isArray(lowStockRes?.data) ? lowStockRes.data : [];
    const outOfStockProducts = rawInventoryItems.filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "stockQuantity" in item &&
        Number((item as { stockQuantity: number }).stockQuantity) === 0
    ).length;
    const lowStockProducts = rawInventoryItems.filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "stockQuantity" in item &&
        Number((item as { stockQuantity: number }).stockQuantity) > 0
    ).length;

    return {
      totalProducts,
      activeProducts,
      archivedProducts,
      lowStockProducts,
      outOfStockProducts,
    };
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      throw error;
    }
    return {
      totalProducts: 0,
      activeProducts: 0,
      archivedProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
    };
  }
}

/**
 * Public: Fetch products for customer storefront with Next.js caching
 */
export async function getPublicProducts(
  filters: ProductFilters = {}
): Promise<ProductsPaginatedResponse> {
  const query = buildProductQueryParams(filters);
  const url = `${apiUrl()}/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: {
      tags: ["products"],
      revalidate: 60,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  return res.json() as Promise<ProductsPaginatedResponse>;
}

/**
 * Public: Fetch product by slug for PDP
 */
export async function getPublicProductBySlug(
  slug: string
): Promise<SingleProductResponse> {
  const cleanSlug = encodeURIComponent(slug.trim());
  const url = `${apiUrl()}/products/slug/${cleanSlug}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: {
      tags: ["products", `product-slug-${slug}`],
      revalidate: 60,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product by slug: ${res.status}`);
  }

  return res.json() as Promise<SingleProductResponse>;
}

/**
 * Public: Fetch related products for PDP
 */
export async function getPublicRelatedProducts(
  id: string,
  limit: number = 4
): Promise<{ success: boolean; data: Product[] }> {
  const cleanId = encodeURIComponent(id.trim());
  const url = `${apiUrl()}/products/${cleanId}/related?limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: {
      tags: ["products", `product-related-${id}`],
      revalidate: 60,
    },
  });

  if (!res.ok) {
    return { success: false, data: [] };
  }

  return res.json() as Promise<{ success: boolean; data: Product[] }>;
}

/**
 * Shared: Fetch categories (for product forms, filters, and navigation)
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const url = `${apiUrl()}/categories`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        tags: ["categories"],
        revalidate: 300,
      },
    });

    if (!res.ok) return [];
    const data: CategoriesResponse = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}
