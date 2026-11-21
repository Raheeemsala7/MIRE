import "server-only";

import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { buildBundleQueryParams, getBundleStatus } from "../utils/bundle.util";
import type {
  BundleFilters,
  BundlesPaginatedResponse,
  SingleBundleResponse,
  BundleOverviewStats,
} from "../types/bundle.types";

/**
 * Admin: Fetch paginated promotional bundles with backend query filtering
 */
export async function getAdminBundles(
  filters: BundleFilters = {}
): Promise<BundlesPaginatedResponse> {
  const query = buildBundleQueryParams(filters);
  const path = `/bundles${query ? `?${query}` : ""}` as `/${string}`;
  return serverApiGet<BundlesPaginatedResponse>(path);
}

/**
 * Admin: Fetch single bundle by ID with populated eligible products and categories
 */
export async function getAdminBundleById(
  id: string
): Promise<SingleBundleResponse> {
  const cleanId = encodeURIComponent(id.trim());
  return serverApiGet<SingleBundleResponse>(`/bundles/${cleanId}` as `/${string}`);
}

/**
 * Admin: Fetch bundle overview aggregate stats backed by real backend data
 */
export async function getAdminBundleOverviewStats(): Promise<BundleOverviewStats> {
  try {
    const [allRes, activeRes] = await Promise.all([
      serverApiGet<BundlesPaginatedResponse>("/bundles?limit=100"),
      serverApiGet<BundlesPaginatedResponse>("/bundles?limit=1&activeOnly=true"),
    ]);

    const bundles = Array.isArray(allRes?.data) ? allRes.data : [];
    const totalBundles = allRes?.meta?.total ?? bundles.length;
    const activeBundles = activeRes?.meta?.total ?? 0;
    const now = new Date();

    let scheduledBundles = 0;
    let expiredBundles = 0;
    let inactiveBundles = 0;

    // If totalBundles <= bundles.length, we have the complete dataset loaded
    if (totalBundles <= bundles.length) {
      for (const bundle of bundles) {
        const status = getBundleStatus(bundle, now);
        switch (status) {
          case "SCHEDULED":
            scheduledBundles++;
            break;
          case "EXPIRED":
            expiredBundles++;
            break;
          case "INACTIVE":
            inactiveBundles++;
            break;
        }
      }
    } else {
      // If total exceeds the 100-limit page, inactive bundles are total minus active
      inactiveBundles = Math.max(0, totalBundles - activeBundles);
    }

    return {
      totalBundles,
      activeBundles,
      scheduledBundles,
      expiredBundles,
      inactiveBundles,
    };
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      throw error;
    }
    return {
      totalBundles: 0,
      activeBundles: 0,
      scheduledBundles: 0,
      expiredBundles: 0,
      inactiveBundles: 0,
    };
  }
}
