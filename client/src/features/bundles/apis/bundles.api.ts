import "server-only";

import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
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
  const token = await getNextAuthToken();
  const query = buildBundleQueryParams(filters);
  const url = `${API_URL}/bundles${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch admin bundles: ${res.status}`);
  }

  return res.json() as Promise<BundlesPaginatedResponse>;
}

/**
 * Admin: Fetch single bundle by ID with populated eligible products and categories
 */
export async function getAdminBundleById(
  id: string
): Promise<SingleBundleResponse> {
  const token = await getNextAuthToken();
  const cleanId = encodeURIComponent(id.trim());
  const url = `${API_URL}/bundles/${cleanId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch bundle: ${res.status}`);
  }

  return res.json() as Promise<SingleBundleResponse>;
}

/**
 * Admin: Fetch bundle overview aggregate stats backed by real backend data
 */
export async function getAdminBundleOverviewStats(): Promise<BundleOverviewStats> {
  const token = await getNextAuthToken();
  const headers = {
    ...HEADERS.JsonBody,
    ...(token?.token ? HEADERS.authorize(token.token) : {}),
  };

  try {
    const [allRes, activeRes] = await Promise.all([
      fetch(`${API_URL}/bundles?limit=100`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API_URL}/bundles?limit=1&activeOnly=true`, { headers, cache: "no-store" }).then((r) => r.json()),
    ]);

    const bundles = Array.isArray(allRes?.data) ? allRes.data : [];
    const totalBundles = allRes?.meta?.total ?? bundles.length;
    const activeBundles = activeRes?.meta?.total ?? 0;
    const now = new Date();

    let scheduledBundles = 0;
    let expiredBundles = 0;
    let inactiveBundles = 0;

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
    }

    return {
      totalBundles,
      activeBundles,
      scheduledBundles,
      expiredBundles,
      inactiveBundles,
    };
  } catch {
    return {
      totalBundles: 0,
      activeBundles: 0,
      scheduledBundles: 0,
      expiredBundles: 0,
      inactiveBundles: 0,
    };
  }
}
