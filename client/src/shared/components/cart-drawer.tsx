"use client";

import React from "react";
import Image from "next/image";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCartStore } from "@/shared/stores/cart-store";

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  );
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex ps-0">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-ds-primary" />
              <h2 className="text-lg font-medium text-ds-text-plain">
                {t("common.bag")} ({items.length})
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-ds-secondary/20 flex items-center justify-center mb-4 text-ds-primary">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-zinc-600 font-medium">
                  {t("common.cartEmpty")}
                </p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  {t("common.cartEmptySubtitle")}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.color}-${item.size}`}
                  className="flex items-center gap-4 py-3 border-b border-zinc-100"
                >
                  <div className="w-16 h-20 rounded-md bg-ds-secondary/30 overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.color} • {item.size}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-500">
                        {t("common.qty")} {item.quantity}
                      </span>
                      <span className="text-sm font-semibold text-ds-primary">
                        {item.price * item.quantity} {t("common.currency")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.color, item.size)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-zinc-600">
                  {t("common.subtotal")}
                </span>
                <span className="text-lg font-bold text-ds-primary">
                  {totalPrice} {t("common.currency")}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  toast.info(t("common.checkoutSoon"));
                }}
                className="w-full py-3.5 px-4 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                {t("common.checkout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
