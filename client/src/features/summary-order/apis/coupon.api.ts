import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";

export interface ValidateCouponApiResponse {
  valid: boolean;
  message?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue?: number;
  discountAmount?: number;
  newTotal?: number;
}

export async function getCouponApi(
  code: string,
  subtotal: number,
  categoryIds?: string[]
): Promise<ValidateCouponApiResponse> {
  const token = await getNextAuthToken();
  const headers: Record<string, string> = {
    ...HEADERS.JsonBody,
    ...(token?.token ? HEADERS.authorize(token.token) : {}),
  };

  const res = await fetch(`${API_URL}/coupons/validate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      code: code.trim().toUpperCase(),
      subtotal,
      categoryIds,
    }),
  });

  const data = await res.json();
  if (res.ok && data?.success && data?.data) {
    return {
      valid: true,
      message: data.message || "تم تطبيق الكوبون بنجاح",
      discountType: data.data.coupon?.discountType,
      discountValue: data.data.coupon?.discountValue,
      discountAmount: data.data.discountAmount,
      newTotal: data.data.newTotal,
    };
  }

  return {
    valid: false,
    message: data?.message || data?.error || "الكوبون غير صالح",
  };
}
