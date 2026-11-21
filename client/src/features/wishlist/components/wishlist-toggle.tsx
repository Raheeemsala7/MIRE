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
  const { toggleItem, isWishlisted } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? isWishlisted(product.id) : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);

    if (!active) {
      toast.success(
        isRTL
          ? `تمت إضافة "${product.titleAr}" إلى قائمة الرغبات`
          : `Added "${product.titleEn}" to your wishlist`
      );
    } else {
      toast.info(
        isRTL
          ? `تمت إزالة "${product.titleAr}" من قائمة الرغبات`
          : `Removed "${product.titleEn}" from your wishlist`
      );
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-ds-border-muted transition-all cursor-pointer ${
          active
            ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/40"
            : "bg-white hover:border-ds-primary text-ds-text-plain hover:text-ds-primary"
        } ${className}`}
      >
        <Heart className={`size-4 ${active ? "fill-rose-500 text-rose-500" : ""}`} />
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
      className={`flex items-center justify-center size-9 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-sm border border-black/5 hover:scale-105 transition-all cursor-pointer ${
        active ? "text-rose-500" : "hover:text-rose-500"
      } ${className}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`size-4 transition-transform ${
          active ? "fill-rose-500 text-rose-500 scale-110" : ""
        }`}
      />
    </button>
  );
}
