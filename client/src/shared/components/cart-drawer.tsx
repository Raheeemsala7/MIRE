"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  Tag,
  Check,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { useCartStore } from "../stores/cart-store";
import { toast } from "sonner";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");

  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    getTotalPrice,
  } = useCartStore();

  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const totalPrice = getTotalPrice();
  const freeShippingThreshold = 1500;
  const isFreeShipping = totalPrice >= freeShippingThreshold && totalPrice > 0;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((totalPrice / freeShippingThreshold) * 100)
  );

  const discountAmount = appliedDiscount
    ? Math.round((totalPrice * appliedDiscount) / 100)
    : 0;
  const shippingFee = items.length === 0 || isFreeShipping ? 0 : 50;
  const grandTotal = Math.max(0, totalPrice - discountAmount + shippingFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    const code = promoCode.trim().toUpperCase();

    if (!code) return;

    if (code === "MIRE10" || code === "WELCOME10") {
      setAppliedDiscount(10);
      toast.success(
        isRTL
          ? "تم تطبيق كود الخصم بنجاح! خصم 10%"
          : "Promo code applied! 10% off"
      );
    } else if (code === "VIP15") {
      setAppliedDiscount(15);
      toast.success(
        isRTL
          ? "تم تطبيق كود الخصم بنجاح! خصم 15%"
          : "VIP promo code applied! 15% off"
      );
    } else {
      setPromoError(isRTL ? "كود الخصم غير صحيح أو منتهي" : "Invalid coupon code");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1c1a1f]/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          isRTL ? "left-0" : "right-0"
        } max-w-full flex pl-0`}
      >
        <div className="w-screen max-w-md bg-[#fdfbf7] dark:bg-[#161517] shadow-2xl flex flex-col justify-between border-s border-ds-border-muted/40">
          {/* Header */}
          <div className="px-6 py-5 border-b border-ds-border-subtle bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-ds-primary/10 text-ds-primary">
                <ShoppingBag className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-semibold text-ds-text-plain tracking-wide">
                  {isRTL ? "حقيبة التسوق" : "Shopping Bag"}
                </h2>
                <span className="text-[11px] text-ds-text-muted">
                  {items.length}{" "}
                  {items.length === 1
                    ? isRTL ? "منتج واحد" : "item"
                    : isRTL ? "منتجات مختارة" : "items"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="size-8 rounded-full flex items-center justify-center hover:bg-black/5 text-ds-text-soft hover:text-ds-text-plain transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Luxury Free Shipping Progress Bar */}
          {items.length > 0 && (
            <div className="px-6 py-3.5 bg-gradient-to-r from-ds-subtle via-ds-plain to-ds-subtle border-b border-ds-border-subtle text-xs space-y-2">
              <div className="flex items-center justify-between text-ds-text-plain font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck className="size-3.5 text-ds-primary" />
                  <span>
                    {isFreeShipping
                      ? isRTL
                        ? "تهانينا! حصلتِ على شحن مجاني"
                        : "You unlocked Free Shipping!"
                      : isRTL
                      ? `تبقّى ${freeShippingThreshold - totalPrice} ج.م للشحن المجاني`
                      : `Add ${freeShippingThreshold - totalPrice} EGP for free delivery`}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-ds-primary">
                  {progressToFreeShipping}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ds-primary to-ds-secondary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="size-20 rounded-3xl bg-ds-primary/5 border border-ds-primary/10 flex items-center justify-center mb-4 text-ds-primary shadow-inner">
                  <ShoppingBag className="size-8 stroke-[1.5]" />
                </div>
                <p className="font-serif text-lg font-semibold text-ds-text-plain">
                  {isRTL ? "حقيبتكِ فارغة حالياً" : "Your bag is empty"}
                </p>
                <p className="text-xs text-ds-text-muted mt-1.5 max-w-xs leading-relaxed">
                  {isRTL
                    ? "تصفحي أحدث القطع المحتشمة والتصاميم الراقية وأضيفيها إلى حقيبتكِ."
                    : "Discover our contemporary silhouettes and curate your personal wardrobe."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-ds-primary text-white text-xs font-semibold tracking-wider hover:bg-ds-primary-saturated transition-all shadow-sm"
                >
                  <span>{isRTL ? "تصفحي التشكيلة" : "Explore Collection"}</span>
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.color}-${item.size}`}
                  className="group relative flex gap-3.5 p-3.5 rounded-2xl border border-ds-border-muted/70 bg-white dark:bg-zinc-900 shadow-2xs hover:border-ds-primary/30 transition-all duration-200"
                >
                  {/* Item Image */}
                  <div className="size-20 rounded-xl overflow-hidden bg-ds-subtle shrink-0 border border-ds-border-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-ds-text-plain truncate leading-snug">
                          {item.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.color, item.size)}
                          className="text-ds-text-soft hover:text-rose-600 transition-colors p-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title={isRTL ? "حذف المنتج" : "Remove"}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-ds-text-muted">
                        <span className="inline-block size-2 rounded-full bg-ds-primary/30" />
                        <span>{item.color}</span>
                        <span className="text-ds-border-muted">•</span>
                        <span>{item.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls Pill */}
                      <div className="flex items-center border border-ds-border-muted rounded-full bg-ds-plain px-2 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.color,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="size-5 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold font-mono text-ds-text-plain">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.color,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="size-5 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xs font-bold text-ds-primary font-mono">
                        {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-ds-border-subtle bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="size-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-ds-text-soft" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError("");
                      }}
                      placeholder={isRTL ? "كود الخصم (جربي MIRE10)" : "Promo code (try MIRE10)"}
                      className="w-full h-9 ps-8 pe-3 rounded-xl border border-ds-border-muted bg-ds-plain text-xs uppercase tracking-wider text-ds-text-plain focus:outline-none focus:ring-1 focus:ring-ds-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-xl border border-ds-border-muted hover:border-ds-primary bg-ds-plain text-xs font-semibold text-ds-text-plain hover:text-ds-primary transition-colors cursor-pointer"
                  >
                    {isRTL ? "تطبيق" : "Apply"}
                  </button>
                </div>
                {appliedDiscount && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
                    <Check className="size-3" />
                    {isRTL ? `تم تفعيل خصم ${appliedDiscount}% بنجاح` : `${appliedDiscount}% discount applied`}
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] text-rose-500 font-medium pt-0.5">
                    {promoError}
                  </p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ds-text-muted">
                  <span>{isRTL ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="font-mono">{totalPrice} {isRTL ? "ج.م" : "EGP"}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{isRTL ? "قيمة الخصم" : "Discount"}</span>
                    <span className="font-mono">-{discountAmount} {isRTL ? "ج.م" : "EGP"}</span>
                  </div>
                )}

                <div className="flex justify-between text-ds-text-muted">
                  <span>{isRTL ? "مصاريف الشحن" : "Shipping"}</span>
                  <span className="font-mono">
                    {isFreeShipping ? (
                      <span className="text-emerald-600 font-semibold">{isRTL ? "مجاني" : "Free"}</span>
                    ) : (
                      `${shippingFee} ${isRTL ? "ج.م" : "EGP"}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-t border-ds-border-muted/60 pt-2 font-semibold text-sm text-ds-text-plain">
                  <span>{isRTL ? "المجموع الكلي" : "Total"}</span>
                  <span className="font-bold text-base text-ds-primary font-mono">
                    {grandTotal} {isRTL ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-12 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>{isRTL ? "متابعة الشراء والدفع" : "Proceed to Checkout"}</span>
                  <ArrowRight className="size-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-10 rounded-full border border-ds-border-muted hover:border-ds-primary text-ds-text-plain text-xs font-semibold transition-all flex items-center justify-center hover:bg-ds-subtle"
                >
                  {isRTL ? "عرض تفاصيل الحقيبة" : "View Full Bag"}
                </Link>
              </div>

              {/* Trust Tag */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-ds-text-soft pt-1">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>{isRTL ? "دفع آمن واسترجاع خلال 14 يوماً" : "100% Secure Checkout & Easy Returns"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
