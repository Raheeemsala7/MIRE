import type { Product, ProductStatus, ProductFilters } from "../types/product.types";

/**
 * Build URL query parameters from ProductFilters
 */
export function buildProductQueryParams(filters: ProductFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search && filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.minPrice !== undefined && filters.minPrice !== "") params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined && filters.maxPrice !== "") params.set("maxPrice", String(filters.maxPrice));
  if (filters.isFeatured !== undefined && filters.isFeatured !== "") params.set("isFeatured", String(filters.isFeatured));
  if (filters.isNewArrival !== undefined && filters.isNewArrival !== "") params.set("isNewArrival", String(filters.isNewArrival));
  if (filters.isBestSeller !== undefined && filters.isBestSeller !== "") params.set("isBestSeller", String(filters.isBestSeller));
  const activeSort = filters.sortBy || filters.sort;
  if (activeSort) params.set("sortBy", activeSort);
  if (filters.admin) params.set("admin", "true");

  return params.toString();
}

/**
 * Format currency with locale-specific formatting
 */
export function formatCurrency(
  amount: number,
  locale: string = "en",
  currency: string = "EGP"
): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Format date string
 */
export function formatProductDate(dateStr: string, locale: string = "en"): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Determine stock status of a product
 */
export function getProductStockStatus(
  product: Pick<Product, "totalStock" | "lowStockThreshold">
): "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK" {
  if (product.totalStock <= 0) return "OUT_OF_STOCK";
  if (product.totalStock <= (product.lowStockThreshold || 5)) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Get badge variant for product status
 */
export function getProductStatusBadgeVariant(
  status: ProductStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "DRAFT":
      return "secondary";
    case "ARCHIVED":
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * Get primary image url from product images
 */
export function getPrimaryImageUrl(
  images: Array<{ url: string; isPrimary?: boolean }> | undefined,
  fallback: string = "/products/skirt/sky-blue.png"
): string {
  if (!images || images.length === 0) return fallback;
  const primary = images.find((img) => img.isPrimary);
  return primary?.url || images[0]?.url || fallback;
}

/**
 * Helper to auto-generate variant SKU from base SKU, color, and size
 */
export function generateVariantSku(baseSku: string, color: string, size: string): string {
  const cleanBase = baseSku.trim().toUpperCase() || "SKU";
  const cleanColor = color
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3) || "CLR";
  const cleanSize = size.trim().toUpperCase() || "STD";
  return `${cleanBase}-${cleanColor}-${cleanSize}`;
}
