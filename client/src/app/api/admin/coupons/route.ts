import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverApiGet, serverApiPost } from "@/lib/auth/session";
import {
  getCoupons,
  addCoupon,
  type CouponRecord as AdminCouponRecord,
} from "@/lib/coupons-store";

export type { AdminCouponRecord };

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

  const coupons = getCoupons();
  return NextResponse.json({
    success: true,
    data: coupons,
    total: coupons.length,
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

  const newCoupon: AdminCouponRecord = {
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
      addCoupon(res.data);
      return NextResponse.json(res, { status: 201 });
    }
  } catch {
    // fallback save locally
  }

  addCoupon(newCoupon);
  return NextResponse.json({
    success: true,
    message: "Coupon created successfully",
    data: newCoupon,
  }, { status: 201 });
}
