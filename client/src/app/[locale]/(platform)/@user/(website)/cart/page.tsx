"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import {
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Truck,
  Tag,
  Check,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/src/shared/stores/cart-store";
import { toast } from "sonner";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");

  const locale = useLocale();
  const isRTL = locale === "ar";
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } =
    useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-16 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-10 w-48 bg-zinc-200 rounded-md mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

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
          ? "تم تفعيل كود الخصم بنجاح! خصم 10%"
          : "Promo code applied! 10% off"
      );
    } else if (code === "VIP15") {
      setAppliedDiscount(15);
      toast.success(
        isRTL
          ? "تم تفعيل كود الخصم بنجاح! خصم 15%"
          : "VIP promo code applied! 15% off"
      );
    } else {
      setPromoError(isRTL ? "كود الخصم غير صحيح أو منتهي" : "Invalid coupon code");
    }
  };

  return (
    <main className="mx-auto min-h-[65vh] max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-ds-border-muted/60 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-ds-primary/10 text-ds-primary shadow-xs border border-ds-primary/20">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-ds-text-plain font-medium">
              {isRTL ? "حقيبة التسوق" : "Shopping Bag"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
              {isRTL
                ? `لديكِ ${items.length} ${
                    items.length === 1 ? "منتج مختار" : "منتجات مختارة"
                  } في حقيبة التسوق الخاصة بكِ`
                : `You have ${items.length} items in your shopping bag`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-ds-text-soft hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="size-3.5" />
            <span>{isRTL ? "تفريغ الحقيبة" : "Clear Bag"}</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-ds-elevated/40 p-16 text-center max-w-lg mx-auto shadow-2xs">
          <div className="size-20 rounded-3xl bg-ds-primary/5 flex items-center justify-center text-ds-primary mb-4 border border-ds-primary/10">
            <ShoppingBag className="size-9 stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-2xl text-ds-text-plain font-semibold">
            {isRTL ? "حقيبة التسوق فارغة" : "Your bag is empty"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-ds-text-muted leading-relaxed max-w-sm">
            {isRTL
              ? "استكشفي أحدث التصاميم والقطع المحتشمة لإضافتها إلى حقيبتكِ الأنيقة."
              : "Explore our contemporary silhouettes and curate your personal collection."}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ds-primary px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
          >
            <span>{isRTL ? "تسوّقي التشكيلة الآن" : "Browse Collection"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          {/* Items & Shipping Column */}
          <div className="space-y-4">
            {/* Free Shipping Banner */}
            <div className="rounded-2xl border border-ds-border-muted/70 bg-gradient-to-r from-ds-subtle via-white to-ds-subtle p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs text-ds-text-plain font-medium">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-ds-primary" />
                  <span>
                    {isFreeShipping
                      ? isRTL
                        ? "✨ مبروك! طلبيتكِ مؤهلة للشحن المجاني لكافة المحافظات"
                        : "✨ Congratulations! You unlocked Free Shipping"
                      : isRTL
                      ? `تبقّى ${freeShippingThreshold - totalPrice} ج.م فقط للاستفادة من الشحن المجاني`
                      : `Add ${freeShippingThreshold - totalPrice} EGP more for free shipping`}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-ds-primary">
                  {progressToFreeShipping}%
                </span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ds-primary to-ds-secondary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>

            {/* Items Cards */}
            <div className="space-y-3.5">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.color}-${item.size}`}
                  className="group flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-ds-border-muted/70 bg-white dark:bg-zinc-900 shadow-2xs hover:border-ds-primary/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-20 sm:size-24 rounded-2xl overflow-hidden bg-ds-subtle shrink-0 border border-ds-border-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-semibold text-ds-text-plain">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-ds-text-muted">
                        <span className="inline-block size-2 rounded-full bg-ds-primary/40" />
                        <span>{item.color}</span>
                        <span className="text-ds-border-muted">•</span>
                        <span>{isRTL ? "المقاس:" : "Size:"} {item.size}</span>
                      </div>
                      <p className="text-xs font-bold text-ds-primary sm:hidden pt-1 font-mono">
                        {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-ds-border-subtle">
                    {/* Quantity Selector Pill */}
                    <div className="flex items-center border border-ds-border-muted rounded-full bg-ds-plain px-3 py-1 shadow-2xs">
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
                        className="size-6 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold font-mono text-ds-text-plain">
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
                        className="size-6 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="hidden sm:block text-end min-w-24">
                      <p className="font-mono text-base font-bold text-ds-text-plain">
                        {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-ds-text-soft font-mono">
                          ({item.price} {isRTL ? "للقطعة" : "each"})
                        </p>
                      )}
                    </div>

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      className="text-ds-text-soft hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                      title={isRTL ? "حذف المنتج" : "Remove"}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping link */}
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs font-semibold text-ds-primary hover:text-ds-primary-saturated transition-colors"
              >
                <ArrowLeft className="size-3.5 rtl:rotate-180" />
                <span>{isRTL ? "العودة لتصفح المزيد من المنتجات" : "Continue Shopping"}</span>
              </Link>
            </div>
          </div>

          {/* Summary Column */}
          <div className="rounded-3xl border border-ds-border-muted/80 bg-ds-elevated p-6 sm:p-7 space-y-6 lg:sticky lg:top-24 shadow-xs">
            <h2 className="font-serif text-lg font-semibold text-ds-text-plain border-b border-ds-border-muted/60 pb-4">
              {isRTL ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <label className="block text-xs font-medium text-ds-text-plain">
                {isRTL ? "كود الخصم أو قسيمة الشراء" : "Coupon or Promo Code"}
              </label>
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
                    placeholder={isRTL ? "جربي كود MIRE10" : "e.g. MIRE10"}
                    className="w-full h-10 ps-8 pe-3 rounded-xl border border-ds-border-muted bg-ds-plain text-xs uppercase tracking-wider text-ds-text-plain focus:outline-none focus:ring-2 focus:ring-ds-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-ds-plain border border-ds-border-muted hover:border-ds-primary text-xs font-semibold text-ds-text-plain hover:text-ds-primary transition-all cursor-pointer"
                >
                  {isRTL ? "تطبيق" : "Apply"}
                </button>
              </div>
              {appliedDiscount && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 pt-1">
                  <Check className="size-3" />
                  {isRTL ? `تم تطبيق خصم ${appliedDiscount}% بنجاح` : `${appliedDiscount}% discount applied`}
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-500 font-medium pt-1">
                  {promoError}
                </p>
              )}
            </form>

            {/* Pricing Breakdown */}
            <div className="space-y-3 text-xs border-t border-ds-border-muted/60 pt-4">
              <div className="flex justify-between text-ds-text-muted">
                <span>{isRTL ? "المجموع الفرعي للمنتجات" : "Items Subtotal"}</span>
                <span className="font-mono text-ds-text-plain font-medium">
                  {totalPrice} {isRTL ? "ج.م" : "EGP"}
                </span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>{isRTL ? `قيمة الخصم (${appliedDiscount}%)` : `Discount (${appliedDiscount}%)`}</span>
                  <span className="font-mono">-{discountAmount} {isRTL ? "ج.م" : "EGP"}</span>
                </div>
              )}

              <div className="flex justify-between text-ds-text-muted">
                <span>{isRTL ? "الشحن والتوصيل" : "Shipping"}</span>
                <span className="font-mono">
                  {isFreeShipping ? (
                    <span className="text-emerald-600 font-semibold">{isRTL ? "مجاني" : "Free"}</span>
                  ) : (
                    `${shippingFee} ${isRTL ? "ج.م" : "EGP"}`
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-ds-border-muted/80 pt-3 text-sm font-semibold text-ds-text-plain">
                <span>{isRTL ? "المجموع الإجمالي" : "Total Amount"}</span>
                <span className="font-mono text-lg text-ds-primary font-bold">
                  {grandTotal} {isRTL ? "ج.م" : "EGP"}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="w-full h-12 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{isRTL ? "المتابعة لإتمام الطلب" : "Proceed to Checkout"}</span>
              <ArrowRight className="size-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>

            {/* Trust Assurances */}
            <div className="rounded-2xl bg-ds-subtle/60 p-3.5 border border-ds-border-subtle space-y-2 text-[11px] text-ds-text-muted">
              <div className="flex items-center gap-2 text-ds-text-plain font-medium">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>{isRTL ? "عملية شراء آمنة وموثوقة 100%" : "100% Secure Checkout"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-ds-primary shrink-0" />
                <span>{isRTL ? "توصيل سريع لكافة محافظات مصر خلال 2-4 أيام" : "Delivery across Egypt in 2-4 business days"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
