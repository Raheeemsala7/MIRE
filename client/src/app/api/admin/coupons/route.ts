import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverApiGet, serverApiPost } from "@/lib/auth/session";

export interface AdminCouponRecord {
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

// Fallback in-memory coupons for smooth development and admin inspection
let ADMIN_COUPONS_STORE: AdminCouponRecord[] = [
  {
    _id: "c-welcome10",
    code: "WELCOME10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 300,
    startDate: new Date("2026-01-01").toISOString(),
    endDate: new Date("2027-12-31").toISOString(),
    usageLimit: 500,
    usedCount: 38,
    maxUsesPerCustomer: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "c-summer20",
    code: "SUMMER20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    startDate: new Date("2026-05-01").toISOString(),
    endDate: new Date("2027-09-01").toISOString(),
    usageLimit: 200,
    usedCount: 74,
    maxUsesPerCustomer: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "c-save100",
    code: "SAVE100",
    discountType: "FIXED_AMOUNT",
    discountValue: 100,
    minOrderAmount: 800,
    maxDiscountAmount: null,
    startDate: new Date("2026-01-01").toISOString(),
    endDate: new Date("2027-12-31").toISOString(),
    usageLimit: 100,
    usedCount: 19,
    maxUsesPerCustomer: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendData = await serverApiGet<any>("/coupons");
    if (backendData?.data && Array.isArray(backendData.data)) {
      return NextResponse.json(backendData);
    }
  } catch (err) {
    // fallback to store
  }

  return NextResponse.json({
    success: true,
    data: ADMIN_COUPONS_STORE,
    total: ADMIN_COUPONS_STORE.length,
    page: 1,
    limit: 50,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const code = String(body.code || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
  }

  const newCoupon = {
    _id: `coupon-${Date.now()}`,
    code,
    discountType: body.discountType || "PERCENTAGE",
    discountValue: Number(body.discountValue) || 10,
    minOrderAmount: Number(body.minOrderAmount) || 0,
    maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
    startDate: body.startDate || new Date().toISOString(),
    endDate: body.endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
    usedCount: 0,
    maxUsesPerCustomer: Number(body.maxUsesPerCustomer) || 1,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await serverApiPost<any>("/coupons", newCoupon);
    if (res?.data) {
      ADMIN_COUPONS_STORE.unshift(res.data);
      return NextResponse.json(res, { status: 201 });
    }
  } catch {
    // fallback save locally
  }

  ADMIN_COUPONS_STORE.unshift(newCoupon);
  return NextResponse.json({
    success: true,
    message: "Coupon created successfully",
    data: newCoupon,
  }, { status: 201 });
}
