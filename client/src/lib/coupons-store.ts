export interface CouponRecord {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
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
}

// Global in-memory coupons store accessible across all API routes
const globalCouponsStore: CouponRecord[] = [
  {
    _id: "c-welcome10",
    code: "WELCOME10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 300,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-12-31T23:59:59.000Z",
    usageLimit: 1000,
    usedCount: 42,
    maxUsesPerCustomer: 1,
    isActive: true,
  },
  {
    _id: "c-mirevip",
    code: "MIREVIP",
    discountType: "FIXED_AMOUNT",
    discountValue: 200,
    minOrderAmount: 1500,
    maxDiscountAmount: null,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-12-31T23:59:59.000Z",
    usageLimit: 200,
    usedCount: 15,
    maxUsesPerCustomer: 1,
    isActive: true,
  },
  {
    _id: "c-summer20",
    code: "SUMMER20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2027-09-01T23:59:59.000Z",
    usageLimit: 200,
    usedCount: 74,
    maxUsesPerCustomer: 2,
    isActive: true,
  },
  {
    _id: "c-save100",
    code: "SAVE100",
    discountType: "FIXED_AMOUNT",
    discountValue: 100,
    minOrderAmount: 800,
    maxDiscountAmount: null,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-12-31T23:59:59.000Z",
    usageLimit: 100,
    usedCount: 19,
    maxUsesPerCustomer: 1,
    isActive: true,
  },
  {
    _id: "c-mire50",
    code: "MIRE50",
    discountType: "FIXED_AMOUNT",
    discountValue: 50,
    minOrderAmount: 500,
    maxDiscountAmount: null,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-12-31T23:59:59.000Z",
    usageLimit: 500,
    usedCount: 8,
    maxUsesPerCustomer: 1,
    isActive: true,
  },
  {
    _id: "c-elegance15",
    code: "ELEGANCE15",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 500,
    maxDiscountAmount: 300,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2027-12-31T23:59:59.000Z",
    usageLimit: 300,
    usedCount: 12,
    maxUsesPerCustomer: 1,
    isActive: true,
  },
];

export function getCoupons(): CouponRecord[] {
  return globalCouponsStore;
}

export function findCoupon(code: string): CouponRecord | undefined {
  const cleanCode = code.trim().toUpperCase();
  return globalCouponsStore.find((c) => c.code === cleanCode);
}

export function addCoupon(coupon: CouponRecord): void {
  const existingIdx = globalCouponsStore.findIndex((c) => c.code === coupon.code);
  if (existingIdx >= 0) {
    globalCouponsStore[existingIdx] = coupon;
  } else {
    globalCouponsStore.unshift(coupon);
  }
}

export function updateCoupon(id: string, updates: Partial<CouponRecord>): CouponRecord | null {
  const coupon = globalCouponsStore.find((c) => c._id === id);
  if (!coupon) return null;
  Object.assign(coupon, updates);
  return coupon;
}

export function deleteCoupon(id: string): boolean {
  const idx = globalCouponsStore.findIndex((c) => c._id === id);
  if (idx === -1) return false;
  globalCouponsStore.splice(idx, 1);
  return true;
}

export function evaluateCoupon(
  coupon: CouponRecord,
  subtotal: number
): { valid: boolean; discount: number; reason?: string } {
  if (!coupon.isActive) {
    return { valid: false, discount: 0, reason: "كود الخصم غير نشط حالياً" };
  }

  const now = new Date();
  if (new Date(coupon.startDate) > now) {
    return { valid: false, discount: 0, reason: "كود الخصم غير مفعل بعد" };
  }
  if (new Date(coupon.endDate) < now) {
    return { valid: false, discount: 0, reason: "كود الخصم منتهي الصلاحية" };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, reason: "تم استنفاذ الحد الأقصى لاستخدام هذا الكوبون" };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      reason: `الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${coupon.minOrderAmount} ج.م`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return { valid: true, discount };
}
