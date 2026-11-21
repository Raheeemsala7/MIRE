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
} from "lucide-react";
import { useCartStore } from "@/src/shared/stores/cart-store";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } =
    useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-16 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-10 w-48 bg-zinc-200 rounded-md mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  const totalPrice = getTotalPrice();
  const freeShippingThreshold = 1500;
  const isFreeShipping = totalPrice >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  return (
    <main className="mx-auto min-h-[65vh] max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-ds-border-muted/60 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm border border-ds-border-subtle">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <h1 className="font-brand-serif text-3xl sm:text-4xl tracking-tight text-ds-text-plain font-medium">
              {isRTL ? "حقيبة التسوق" : "Shopping Bag"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
              {isRTL
                ? `لديكِ ${items.length} منتجات في حقيبة التسوق`
                : `You have ${items.length} items in your bag`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-ds-text-soft hover:text-destructive flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>{isRTL ? "تفريغ الحقيبة" : "Empty Bag"}</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-white/50 p-16 text-center max-w-lg mx-auto">
          <div className="size-20 rounded-full bg-ds-subtle flex items-center justify-center text-ds-primary/60 mb-4 border border-ds-border-subtle">
            <ShoppingBag className="size-9" />
          </div>
          <h2 className="font-serif text-2xl text-ds-text-plain font-medium">
            {isRTL ? "حقيبة التسوق فارغة" : "Your bag is empty"}
          </h2>
          <p className="mt-2 text-sm text-ds-text-muted leading-relaxed">
            {isRTL
              ? "استكشفي أحدث التصاميم والقطع المحتشمة لإضافتها إلى حقيبتكِ."
              : "Explore our contemporary modest silhouettes and find something you love."}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ds-primary px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
          >
            <span>{isRTL ? "تسوّقي الآن" : "Shop Collection"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Items List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.color}-${item.size}`}
                className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-ds-border-subtle bg-white dark:bg-zinc-900 shadow-2xs hover:border-ds-primary/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="size-20 sm:size-24 rounded-xl overflow-hidden bg-ds-secondary/15 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-semibold text-ds-text-plain">
                      {item.title}
                    </h3>
                    <p className="text-xs text-ds-text-muted">
                      {isRTL ? "اللون:" : "Color:"} {item.color} •{" "}
                      {isRTL ? "المقاس:" : "Size:"} {item.size}
                    </p>
                    <p className="text-xs font-bold text-ds-primary sm:hidden">
                      {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-ds-border-subtle">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-ds-border-muted/80 rounded-full bg-white dark:bg-zinc-800 px-3 py-1">
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
                      className="size-6 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold font-mono">
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
                      className="size-6 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <span className="hidden sm:block text-sm font-bold text-ds-text-plain font-mono min-w-[80px] text-end">
                    {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id, item.color, item.size)}
                    className="size-8 rounded-full flex items-center justify-center text-ds-text-soft hover:text-destructive hover:bg-rose-50 transition-colors"
                    title={isRTL ? "حذف المنتج" : "Delete"}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Free shipping banner */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs">
              <Truck className="size-5 shrink-0" />
              <span>
                {isFreeShipping
                  ? isRTL
                    ? "طلبكِ مؤهل للشحن المجاني السريع لكافة محافظات مصر!"
                    : "Your order qualifies for Complimentary Express Delivery across Egypt!"
                  : isRTL
                  ? `أضيفي قطع بقيمة ${
                      freeShippingThreshold - totalPrice
                    } ج.م للحصول على شحن مجاني.`
                  : `Add ${
                      freeShippingThreshold - totalPrice
                    } EGP more to enjoy Free Shipping.`}
              </span>
            </div>
          </div>

          {/* Order Summary Side Card */}
          <div className="h-fit rounded-2xl border border-ds-border-muted bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="font-serif text-xl text-ds-text-plain font-semibold">
              {isRTL ? "ملخص الحقيبة" : "Order Summary"}
            </h2>

            <div className="space-y-3 text-xs sm:text-sm border-b border-ds-border-subtle pb-6">
              <div className="flex justify-between text-ds-text-muted">
                <span>{isRTL ? "مجموع المنتجات" : "Items Subtotal"}</span>
                <span className="font-medium text-ds-text-plain font-mono">
                  {totalPrice} {isRTL ? "ج.م" : "EGP"}
                </span>
              </div>
              <div className="flex justify-between text-ds-text-muted">
                <span>{isRTL ? "تكلفة الشحن" : "Shipping"}</span>
                <span
                  className={
                    isFreeShipping
                      ? "text-emerald-600 font-semibold"
                      : "text-ds-text-plain font-mono"
                  }
                >
                  {isFreeShipping
                    ? isRTL
                      ? "مجاني"
                      : "Free"
                    : `${shippingFee} ${isRTL ? "ج.م" : "EGP"}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-ds-text-plain">
              <span>{isRTL ? "الإجمالي الكلي" : "Total Amount"}</span>
              <span className="text-ds-primary font-mono text-lg">
                {grandTotal} {isRTL ? "ج.م" : "EGP"}
              </span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 text-center"
            >
              <span>{isRTL ? "متابعة إتمام الطلب" : "Proceed to Checkout"}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-[11px] text-ds-text-soft">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>{isRTL ? "دفع آمن 100% عند الاستلام" : "100% Secure Checkout"}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
