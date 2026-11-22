"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { useCartStore } from "@/shared/stores/cart-store";
import { useValidateCoupon } from "@/features/admin/coupons/hooks/use-validate-coupon";
import { toast } from "sonner";

interface CouponInputProps {
  className?: string;
  onSuccess?: () => void;
}

export function CouponInput({ className = "", onSuccess }: CouponInputProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const { coupon, applyCoupon, removeCoupon, getTotalPrice, getDiscountAmount } = useCartStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const subtotal = getTotalPrice();
  const discountAmount = getDiscountAmount();

  const validateMutation = useValidateCoupon(
    (data) => {
      const { discount, appliedCoupon } = data;

      applyCoupon({
        code: appliedCoupon.code,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        discountAmount: discount,
        minOrderAmount: appliedCoupon.minOrderAmount,
      });

      toast.success(
        isAr
          ? `تم تطبيق الكوبون بنجاح! وفّرتِ ${discount} ج.م`
          : `Coupon applied! You saved ${discount} EGP`
      );
      setCode("");
      setError("");
      if (onSuccess) onSuccess();
    },
    (err) => {
      setError(err.message || (isAr ? "كود الخصم غير صحيح أو منتهي" : "Invalid or expired coupon"));
      toast.error(err.message || (isAr ? "تعذر تطبيق الكوبون" : "Failed to apply coupon"));
    }
  );

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (subtotal <= 0) {
      setError(isAr ? "حقيبة التسوق فارغة" : "Your cart is empty");
      return;
    }

    setError("");
    validateMutation.mutate({ code: cleanCode, subtotal });
  };

  const handleRemove = () => {
    removeCoupon();
    toast.info(isAr ? "تمت إزالة كود الخصم" : "Coupon removed");
  };

  if (coupon) {
    return (
      <div
        className={`flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                {coupon.code}
              </span>
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {coupon.discountType === "PERCENTAGE"
                  ? `${coupon.discountValue}%`
                  : `${coupon.discountValue} ${isAr ? "ج.م" : "EGP"}`}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              {isAr
                ? `خصم مطبق: -${discountAmount} ج.م`
                : `Discount: -${discountAmount} EGP`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-900 dark:text-emerald-300 transition-colors cursor-pointer"
          title={isAr ? "إزالة الكوبون" : "Remove coupon"}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="size-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-ds-text-soft pointer-events-none" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder={isAr ? "كود الخصم (مثل WELCOME10)" : "Promo code (e.g. WELCOME10)"}
            className="w-full h-10 ps-9 pe-3 rounded-xl border border-ds-border-muted bg-ds-plain text-xs font-medium uppercase tracking-wider text-ds-text-plain placeholder:normal-case placeholder:text-ds-text-soft focus:outline-none focus:ring-1 focus:ring-ds-primary"
            disabled={validateMutation.isPending}
          />
        </div>
        <button
          type="submit"
          disabled={validateMutation.isPending || !code.trim()}
          className="h-10 px-4 rounded-xl bg-ds-primary hover:bg-ds-primary/90 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {validateMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <span>{isAr ? "تطبيق" : "Apply"}</span>
          )}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium px-1">
          {error}
        </p>
      )}
    </form>
  );
}
