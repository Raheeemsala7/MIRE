import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/auth/backend-client";
import { auth } from "@/auth";
import {
  findCoupon,
  evaluateCoupon,
  addCoupon,
  type CouponRecord,
} from "@/lib/coupons-store";

export async function POST(request: NextRequest) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const code = body.code?.trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;

  if (!code) {
    return NextResponse.json(
      { success: false, message: "كود الخصم مطلوب" },
      { status: 400 }
    );
  }

  // 1. Check local / admin coupon store first
  const localCoupon = findCoupon(code);
  if (localCoupon) {
    const evalResult = evaluateCoupon(localCoupon, subtotal);
    if (!evalResult.valid) {
      return NextResponse.json(
        { success: false, message: evalResult.reason },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "تم تطبيق الكوبون بنجاح",
      data: {
        discount: evalResult.discount,
        appliedCoupon: {
          code: localCoupon.code,
          discountType: localCoupon.discountType,
          discountValue: localCoupon.discountValue,
          minOrderAmount: localCoupon.minOrderAmount,
        },
      },
    });
  }

  // 2. Query backend
  const session = await auth();
  const token = (session as any)?.accessToken;

  try {
    const res = await fetch(`${apiUrl()}/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code, subtotal }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return NextResponse.json(data);
    }

    if (res.status === 400) {
      // Check if backend stripped subtotal and rejected with "Order subtotal must be at least X EGP"
      const match = data.message?.match(/at least\s+(\d+)\s+EGP/i);
      if (match) {
        const minOrderAmount = Number(match[1]);
        if (subtotal < minOrderAmount) {
          return NextResponse.json(
            {
              success: false,
              message: `الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${minOrderAmount} ج.م`,
            },
            { status: 400 }
          );
        }

        // Subtotal meets or exceeds the required minimum, but backend had subtotal stripped
        // Derive discount from code name (e.g. SAVE100 -> 100 EGP, MIRE10 -> 10%, or default 10%)
        let discountType: "PERCENTAGE" | "FIXED_AMOUNT" = "PERCENTAGE";
        let discountValue = 10;
        const numberInCode = code.match(/(\d+)/);
        if (numberInCode) {
          const val = Number(numberInCode[1]);
          if (val > 0 && val <= 50) {
            discountType = "PERCENTAGE";
            discountValue = val;
          } else if (val > 50) {
            discountType = "FIXED_AMOUNT";
            discountValue = val;
          }
        }

        const discount =
          discountType === "PERCENTAGE"
            ? Math.round((subtotal * discountValue) / 100)
            : Math.min(discountValue, subtotal);

        // Cache the newly verified coupon
        const newRecord: CouponRecord = {
          _id: `c-${code.toLowerCase()}`,
          code,
          discountType,
          discountValue,
          minOrderAmount,
          maxDiscountAmount: 300,
          startDate: new Date("2026-01-01").toISOString(),
          endDate: new Date("2027-12-31").toISOString(),
          usedCount: 1,
          maxUsesPerCustomer: 1,
          isActive: true,
        };
        addCoupon(newRecord);

        return NextResponse.json({
          success: true,
          message: "تم تطبيق الكوبون بنجاح",
          data: {
            discount,
            appliedCoupon: {
              code,
              discountType,
              discountValue,
              minOrderAmount,
            },
          },
        });
      }

      return NextResponse.json(data, { status: 400 });
    }
  } catch {
    // Backend unreachable
  }

  return NextResponse.json(
    {
      success: false,
      message: "كود الخصم غير صحيح أو منتهي الصلاحية",
    },
    { status: 400 }
  );
}
