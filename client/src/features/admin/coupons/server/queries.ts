import "server-only";

import { serverApiGet } from "@/lib/auth/session";
import type { CouponItem } from "../components/coupons-manager";

export interface CouponsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CouponItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Fetch real coupons list from the backend database (Admin)
 */
export async function getAdminCoupons(): Promise<CouponItem[]> {
  try {
    const res = await serverApiGet<CouponsApiResponse>("/coupons?limit=100");
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (error) {
    console.error("getAdminCoupons: Error fetching coupons from backend", error);
  }
  return [];
}
