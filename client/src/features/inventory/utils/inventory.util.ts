import type {
  StockStatus,
  LowStockItem,
  InventoryOverviewStats,
  InventoryMovementsFilterParams,
} from "../types/inventory.types";

/**
 * Determine stock availability status based on current stock and threshold
 */
export function determineStockStatus(
  stockQuantity: number,
  threshold: number
): StockStatus {
  if (stockQuantity <= 0) return "OUT_OF_STOCK";
  if (stockQuantity <= threshold) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Format quantity change with sign (+ / -) in the given locale
 */
export function formatQuantityChange(
  quantity: number,
  locale: string = "en"
): string {
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    signDisplay: "always",
  });
  return formatter.format(quantity);
}

/**
 * Format ISO date string into readable localized date and time
 */
export function formatInventoryDate(
  dateString: string,
  locale: string = "en"
): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calculate minimum units required to bring stock back above safety threshold
 */
export function calculateReplenishmentUnits(
  stockQuantity: number,
  threshold: number
): number {
  if (stockQuantity > threshold) return 0;
  return Math.max(1, threshold - Math.max(0, stockQuantity) + 1);
}

/**
 * Build URL search parameters string for inventory movements
 */
export function buildMovementsQueryParams(
  params: InventoryMovementsFilterParams = {}
): string {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null) {
    query.set("page", String(params.page));
  }
  if (params.limit !== undefined && params.limit !== null) {
    query.set("limit", String(params.limit));
  }
  if (params.productId && params.productId.trim()) {
    query.set("productId", params.productId.trim());
  }
  if (params.variantSku && params.variantSku.trim()) {
    query.set("variantSku", params.variantSku.trim());
  }
  if (params.type && params.type !== "ALL") {
    query.set("type", params.type.trim());
  }
  // The backend pagination expects 'sortBy' (field:asc or field:desc)
  const sortParam = params.sortBy || params.sort;
  if (sortParam) {
    query.set("sortBy", sortParam);
  }

  return query.toString();
}

/**
 * Calculate reliable overview totals strictly from authoritative backend data
 */
export function calculateOverviewStats(
  lowStockItems: LowStockItem[] = [],
  totalMovements: number = 0
): InventoryOverviewStats {
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const replenishmentProductIds = new Set<string>();

  for (const item of lowStockItems) {
    if (item.stockQuantity <= 0) {
      outOfStockCount++;
    } else {
      lowStockCount++;
    }
    if (item.productId) {
      replenishmentProductIds.add(String(item.productId));
    }
  }

  return {
    lowStockCount,
    outOfStockCount,
    totalMovements,
    replenishmentProductsCount: replenishmentProductIds.size,
  };
}
