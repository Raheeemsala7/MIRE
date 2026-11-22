export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface CouponItem {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  maxUsesPerCustomer: number;
  isActive: boolean;
  createdAt?: string;
  description?: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startDate?: string;
  endDate?: string;
  usageLimit?: number | null;
  perUserLimit?: number;
  maxUsesPerCustomer?: number;
  isActive?: boolean;
  description?: string;
}

export interface UpdateCouponInput {
  isActive?: boolean;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  endDate?: string;
  usageLimit?: number | null;
  description?: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue?: number;
  discountAmount?: number;
  newTotal?: number;
  message?: string;
  coupon?: CouponItem;
}
