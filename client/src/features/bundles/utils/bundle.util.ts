import type {
  Bundle,
  BundleStatus,
  BundleType,
  BundleFilters,
} from "../types/bundle.types";

/**
 * Filter bundles client-side when backend does not natively evaluate search, type, or dynamic status
 */
export function filterBundlesClientSide(
  bundles: Bundle[],
  filters: Pick<BundleFilters, "search" | "type" | "status">,
  now: Date = new Date()
): Bundle[] {
  let result = bundles;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q)
    );
  }

  if (filters.type && (filters.type as string) !== "ALL") {
    result = result.filter((b) => b.type === filters.type);
  }

  if (filters.status && filters.status !== "ALL") {
    result = result.filter((b) => getBundleStatus(b, now) === filters.status);
  }

  return result;
}

/**
 * Determine the dynamic status of a bundle based on active flag and start/end dates
 */
export function getBundleStatus(
  bundle: Pick<Bundle, "isActive" | "startDate" | "endDate">,
  now: Date = new Date()
): BundleStatus {
  if (!bundle.isActive) {
    return "INACTIVE";
  }

  const start = new Date(bundle.startDate);
  const end = new Date(bundle.endDate);

  if (start > now) {
    return "SCHEDULED";
  }

  if (end < now) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

/**
 * Returns badge variant and translation key for bundle status
 */
export function getBundleStatusBadgeConfig(status: BundleStatus): {
  labelKey: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  className: string;
} {
  switch (status) {
    case "ACTIVE":
      return {
        labelKey: "bundle-status-active",
        variant: "default",
        className: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20",
      };
    case "SCHEDULED":
      return {
        labelKey: "bundle-status-scheduled",
        variant: "secondary",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    case "EXPIRED":
      return {
        labelKey: "bundle-status-expired",
        variant: "destructive",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      };
    case "INACTIVE":
    default:
      return {
        labelKey: "bundle-status-inactive",
        variant: "outline",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

/**
 * Get translation key for bundle type
 */
export function getBundleTypeLabelKey(type: BundleType): string {
  switch (type) {
    case "FIXED_PRICE":
      return "bundle-type-fixed-price";
    case "BUY_X_GET_Y":
      return "bundle-type-buy-x-get-y";
    case "PERCENTAGE":
      return "bundle-type-percentage";
    case "COLLECTION_PICK":
      return "bundle-type-collection-pick";
    default:
      return "bundle-type-unknown";
  }
}

/**
 * Build URL query parameters from BundleFilters
 */
export function buildBundleQueryParams(filters: BundleFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.limit && filters.limit !== 20) {
    params.set("limit", String(filters.limit));
  }
  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.type) {
    params.set("type", filters.type);
  }
  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
    if (filters.status === "ACTIVE") {
      params.set("activeOnly", "true");
    }
  } else if (filters.activeOnly) {
    params.set("activeOnly", "true");
  }
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  return params.toString();
}

/**
 * Locale-aware currency formatting
 */
export function formatBundleCurrency(
  amount: number | null | undefined,
  locale: string = "en",
  currency: string = "EGP"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Locale-aware date and time formatting
 */
export function formatBundleDate(
  dateValue: string | Date,
  locale: string = "en",
  includeTime: boolean = false
): string {
  if (!dateValue) return "-";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) return "-";

  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime
        ? { hour: "2-digit", minute: "2-digit", hour12: true }
        : {}),
    };
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", options).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}
