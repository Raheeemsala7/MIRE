import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import type { CouponItem } from "../types/coupon.types";

export interface CouponsApiResponse {
  success: boolean;
  status?: boolean;
  message?: string;
  data: CouponItem[];
}

export async function getAdminCouponsApi(): Promise<CouponItem[]> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/coupons`, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("getAdminCouponsApi error:", error);
    return [];
  }
}
