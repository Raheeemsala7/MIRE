"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { useWishlistStore } from "../store/wishlist.store";
import type { WishlistProduct } from "../types/wishlist";

interface WishlistToggleProps {
  product: WishlistProduct;
  className?: string;
  variant?: "icon" | "button";
}

export function WishlistToggle({
  product,
  className = "",
  variant = "icon",
}: WishlistToggleProps) {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const isItemSaved = useWishlistStore((state) =>
    state.items.some(
      (i) => i.id === product.id || (Boolean(product.slug) && i.slug === product.slug)
    )
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted && isItemSaved;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);

    if (!active) {
      toast.success(
        isRTL
          ? `تمت إضافة "${product.titleAr || product.titleEn}" إلى قائمة الرغبات`
          : `Added "${product.titleEn || product.titleAr}" to your wishlist`
      );
    } else {
      toast.info(
        isRTL
          ? `تمت إزالة "${product.titleAr || product.titleEn}" من قائمة الرغبات`
          : `Removed "${product.titleEn || product.titleAr}" from your wishlist`
      );
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border transition-all duration-200 cursor-pointer ${
          active
            ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800"
            : "bg-white dark:bg-zinc-900 border-border/80 hover:border-primary text-foreground hover:text-primary"
        } ${className}`}
      >
        <Heart
          className={`size-4 transition-transform duration-200 ${
            active ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
          }`}
        />
        <span className="text-xs font-semibold">
          {active
            ? isRTL
              ? "في قائمة الرغبات"
              : "In Wishlist"
            : isRTL
            ? "أضيفي للمفضلة"
            : "Add to Wishlist"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center justify-center size-9 rounded-full shadow-xs border transition-all duration-200 cursor-pointer active:scale-90 ${
        active
          ? "bg-rose-50/95 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-500 shadow-sm"
          : "bg-white/90 dark:bg-zinc-900/90 hover:bg-white text-muted-foreground hover:text-rose-500 border-black/5 hover:scale-105"
      } ${className}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`size-4 transition-transform duration-200 ${
          active ? "fill-rose-500 text-rose-500 scale-110" : ""
        }`}
      />
    </button>
  );
}
