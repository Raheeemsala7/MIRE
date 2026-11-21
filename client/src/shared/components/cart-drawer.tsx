"use client";

import React, { useEffect, useState } from "react";
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { useCartStore } from "../stores/cart-store";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotalPrice } =
    useCartStore();
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const totalPrice = getTotalPrice();
  const freeShippingThreshold = 1500;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((totalPrice / freeShippingThreshold) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          isRTL ? "left-0" : "right-0"
        } max-w-full flex pl-0`}
      >
        <div className="w-screen max-w-md bg-[#fdfbf7] dark:bg-[#161517] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-ds-border-subtle bg-white/70 dark:bg-zinc-900/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-ds-primary" />
              <h2 className="text-base font-semibold text-ds-text-plain">
                {t("common.bag")} ({items.length})
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 -m-2 rounded-full hover:bg-black/5 text-ds-text-soft hover:text-ds-text-plain transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {items.length > 0 && (
            <div className="px-6 py-3 bg-ds-subtle/80 border-b border-ds-border-subtle text-xs space-y-1.5">
              <div className="flex justify-between font-medium text-ds-text-plain">
                <span>
                  {totalPrice >= freeShippingThreshold
                    ? isRTL
                      ? "🎉 مؤهلة للشحن المجاني!"
                      : "🎉 You unlocked Free Shipping!"
                    : isRTL
                    ? `تبقّى ${freeShippingThreshold - totalPrice} ج.م للشحن المجاني`
                    : `Add ${freeShippingThreshold - totalPrice} EGP for free delivery`}
                </span>
                <span className="font-mono text-ds-primary">
                  {progressToFreeShipping}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ds-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="size-16 rounded-full bg-ds-secondary/20 flex items-center justify-center mb-4 text-ds-primary">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-ds-text-plain font-medium text-base">
                  {isRTL ? "حقيبة التسوق فارغة حالياً" : "Your shopping bag is empty"}
                </p>
                <p className="text-xs text-ds-text-muted mt-1 max-w-xs leading-relaxed">
                  {isRTL
                    ? "تصفحي مجموعتنا المميزة من الأزياء المحتشمة وأضيفي ما يناسبك"
                    : "Explore our modest collections and add your favorite pieces."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-6 inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-ds-primary text-white text-xs font-semibold hover:bg-ds-primary-saturated transition-colors"
                >
                  <span>{isRTL ? "تسوقي الآن" : "Start Shopping"}</span>
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.color}-${item.size}`}
                  className="flex gap-4 p-3 rounded-xl border border-ds-border-subtle bg-white dark:bg-zinc-900 shadow-2xs"
                >
                  {/* Item Image */}
                  <div className="size-20 rounded-lg overflow-hidden bg-ds-secondary/15 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Meta & Controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-ds-text-plain line-clamp-1">
                          {item.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.color, item.size)}
                          className="text-ds-text-soft hover:text-destructive transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-ds-text-muted mt-0.5">
                        {item.color} • {item.size}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-ds-border-muted/80 rounded-full bg-white dark:bg-zinc-800 px-2 py-0.5">
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
                          className="size-5 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold font-mono">
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
                          className="size-5 flex items-center justify-center text-ds-text-soft hover:text-ds-text-plain"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xs font-bold text-ds-text-plain">
                        {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Checkout CTA */}
          {items.length > 0 && (
            <div className="p-6 border-t border-ds-border-subtle bg-white/80 dark:bg-zinc-900/80 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ds-text-muted">
                  <span>{isRTL ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="font-semibold text-ds-text-plain">
                    {totalPrice} {isRTL ? "ج.م" : "EGP"}
                  </span>
                </div>
                <div className="flex justify-between text-ds-text-muted">
                  <span>{isRTL ? "الشحن التقديري" : "Estimated Shipping"}</span>
                  <span className="text-emerald-600 font-semibold">
                    {totalPrice >= freeShippingThreshold
                      ? isRTL
                        ? "مجاني"
                        : "Free"
                      : isRTL
                      ? "٥٠ ج.م"
                      : "50 EGP"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-ds-text-plain pt-2 border-t border-ds-border-subtle">
                  <span>{isRTL ? "الإجمالي الكلي" : "Total"}</span>
                  <span className="text-ds-primary font-mono text-base">
                    {totalPrice +
                      (totalPrice >= freeShippingThreshold ? 0 : 50)}{" "}
                    {isRTL ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="py-3 px-4 rounded-full border border-ds-border-muted hover:border-ds-primary text-ds-text-plain text-center text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  {isRTL ? "عرض السلة" : "View Cart"}
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="py-3 px-4 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-center text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{isRTL ? "إتمام الطلب" : "Checkout"}</span>
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
