import "server-only";

import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
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
  const token = await getNextAuthToken();
  const query = buildProductQueryParams({ ...filters, admin: true });
  const url = `${API_URL}/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch admin products: ${res.status}`);
  }

  return res.json() as Promise<ProductsPaginatedResponse>;
}

/**
 * Admin: Fetch single product by ID
 */
export async function getAdminProductById(id: string): Promise<SingleProductResponse> {
  const token = await getNextAuthToken();
  const cleanId = encodeURIComponent(id.trim());
  const url = `${API_URL}/products/${cleanId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch admin product: ${res.status}`);
  }

  return res.json() as Promise<SingleProductResponse>;
}

/**
 * Admin: Fetch real overview aggregate stats using actual backend responses
 */
export async function getAdminProductOverviewStats(): Promise<ProductOverviewStats> {
  const token = await getNextAuthToken();
  const headers = {
    ...HEADERS.JsonBody,
    ...(token?.token ? HEADERS.authorize(token.token) : {}),
  };

  try {
    const [allRes, activeRes, archivedRes, lowStockRes] = await Promise.all([
      fetch(`${API_URL}/products?limit=1&admin=true`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API_URL}/products?limit=1&status=ACTIVE&admin=true`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API_URL}/products?limit=1&status=ARCHIVED&admin=true`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API_URL}/inventory/low-stock`, { headers, cache: "no-store" }).then((r) => r.json()).catch(() => null),
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
  } catch {
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
  const url = `${API_URL}/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...HEADERS.JsonBody },
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
  const url = `${API_URL}/products/slug/${cleanSlug}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...HEADERS.JsonBody },
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
  const url = `${API_URL}/products/${cleanId}/related?limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...HEADERS.JsonBody },
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
    const url = `${API_URL}/categories`;
    const res = await fetch(url, {
      method: "GET",
      headers: { ...HEADERS.JsonBody },
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
