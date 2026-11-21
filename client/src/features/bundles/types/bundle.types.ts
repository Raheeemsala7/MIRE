import type { Product, CategoryItem } from "@/features/products";

export const BUNDLE_TYPES = [
  "FIXED_PRICE",
  "BUY_X_GET_Y",
  "PERCENTAGE",
  "COLLECTION_PICK",
] as const;

export type BundleType = (typeof BUNDLE_TYPES)[number];

export const BUNDLE_STATUSES = [
  "ALL",
  "ACTIVE",
  "SCHEDULED",
  "EXPIRED",
  "INACTIVE",
] as const;

export type BundleStatus = (typeof BUNDLE_STATUSES)[number];

export interface BundleProductSummary {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  images?: Array<{ url: string; isPrimary?: boolean; publicId?: string }>;
  stockQuantity?: number;
}

export interface BundleCategorySummary {
  _id: string;
  name: string;
  slug: string;
}

export interface Bundle {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: BundleType;
  eligibleProducts: Array<BundleProductSummary | Product | string>;
  eligibleCategories: Array<BundleCategorySummary | CategoryItem | string>;
  requiredQuantity: number;
  freeQuantity: number;
  bundlePrice: number | null;
  discountPercentage: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usedCount: number;
  maxUsesPerCustomer: number;
  isActive: boolean;
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BundleFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: BundleType;
  status?: BundleStatus;
  activeOnly?: boolean;
  sortBy?: string;
}

export interface BundlesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BundlesPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Bundle[];
  meta: BundlesPaginationMeta;
}

export interface SingleBundleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Bundle;
}

export interface BundleOverviewStats {
  totalBundles: number;
  activeBundles: number;
  scheduledBundles: number;
  expiredBundles: number;
  inactiveBundles: number;
}
