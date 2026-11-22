import "server-only";

import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { getCategories } from "@/features/products/apis/products.api";
import type {
  CategoryItem,
  CategoriesResponse,
  SingleCategoryResponse,
  CategoryOverviewStats,
} from "../types/category.types";
import { calculateCategoryStats } from "../utils/category.util";

/**
 * Re-export the existing shared categories fetching logic for storefront and products.
 * This directly reuses the canonical server-side data access layer.
 */
export { getCategories };

/**
 * Public: Alias to getCategories with 300s cache revalidation and "categories" tag.
 */
export const getPublicCategories = getCategories;

/**
 * Admin: Fetch full category list (including inactive categories) for management dashboard.
 * Requires admin token; uses cache: "no-store" to ensure real-time management view.
 */
export async function getAdminCategories(options?: {
  search?: string;
  includeInactive?: boolean;
}): Promise<CategoryItem[]> {
  const token = await getNextAuthToken();
  const includeInactive = options?.includeInactive ?? true;
  const searchParam = options?.search
    ? `&search=${encodeURIComponent(options.search)}`
    : "";
  const url = `${API_URL}/categories?includeInactive=${includeInactive}${searchParam}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    cache: "no-store",
    next: {
      tags: ["categories-admin"],
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch admin categories: ${res.status}`);
  }

  const json: CategoriesResponse = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * Shared: Get single category by its URL slug.
 * Documented endpoint: GET /categories/{slug}
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
  try {
    const cleanSlug = encodeURIComponent(slug.trim());
    const res = await fetch(`${API_URL}/categories/${cleanSlug}`, {
      method: "GET",
      headers: { ...HEADERS.JsonBody },
      next: {
        tags: ["categories", `category-slug-${slug}`],
        revalidate: 300,
      },
    });

    if (!res.ok) return null;
    const json: SingleCategoryResponse = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Admin: Resolves a category by ID without inventing unsupported endpoints or making duplicate round-trips.
 * Reuses verified admin list or preloaded categories when passed from Server Component.
 */
export async function getAdminCategoryById(
  id: string,
  preloadedCategories?: CategoryItem[]
): Promise<CategoryItem | null> {
  const cleanId = id.trim();
  const allCategories =
    preloadedCategories || (await getAdminCategories({ includeInactive: true }));
  const found = allCategories.find((c) => c._id === cleanId || c.slug === cleanId);
  return found ?? null;
}

/**
 * Admin: Computes overview metrics from live category records
 */
export async function getAdminCategoryOverviewStats(
  preloadedCategories?: CategoryItem[]
): Promise<CategoryOverviewStats> {
  const categories =
    preloadedCategories || (await getAdminCategories({ includeInactive: true }));
  return calculateCategoryStats(categories);
}
