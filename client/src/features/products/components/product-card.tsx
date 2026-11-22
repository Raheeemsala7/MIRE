"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/shared/stores/cart-store";
import { WishlistToggle } from "@/features/wishlist";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  titleAr?: string;
  category?: string;
  categoryAr?: string;
  price: number;
  originalPrice?: number;
  image: string;
  secondaryImage?: string;
  colorHex?: string;
  colorName?: string;
  isNew?: boolean;
}

export function ProductCard({
  id,
  slug,
  title,
  titleAr,
  category,
  categoryAr,
  price,
  originalPrice,
  image,
  secondaryImage,
  colorHex,
  colorName,
  isNew,
}: ProductCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";
  const displayTitle = isAr ? titleAr || title : title;
  const displayCategory = isAr ? categoryAr || category : category;

  const { addItem, setIsOpen } = useCartStore();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id,
      title: displayTitle,
      price,
      color: colorName || (isAr ? "اللون المعروض" : "Featured Color"),
      size: "M",
      image,
    });

    toast.success(
      isAr
        ? `تمت إضافة "${displayTitle}" إلى حقيبة التسوق`
        : `Added "${displayTitle}" to your shopping bag`,
      {
        action: {
          label: isAr ? "عرض الحقيبة" : "View Bag",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-border hover:shadow-md">
      {/* Visual Frame */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-muted/30">
        <Link href={`/products/${slug}`} className="block size-full">
          {/* Main Product Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={displayTitle}
            className={`size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              secondaryImage ? "group-hover:opacity-0 transition-opacity" : ""
            }`}
            loading="lazy"
          />

          {/* Secondary Hover Image if available */}
          {secondaryImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={secondaryImage}
              alt={displayTitle}
              className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
            />
          )}
        </Link>

        {/* Top Badges & Actions */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isNew && (
              <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase shadow-xs">
                {isAr ? "جديد" : "NEW"}
              </span>
            )}
            {discountPercent && (
              <span className="rounded-full bg-rose-600/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-xs">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <div className="pointer-events-auto">
            <WishlistToggle
              product={{
                id,
                slug,
                titleEn: title,
                titleAr: titleAr || title,
                price,
                image,
                color: colorName,
              }}
            />
          </div>
        </div>

        {/* Quick Add Floating Pill on Hover */}
        <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hidden sm:block">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-background/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-foreground shadow-md border border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            <span>{isAr ? "إضافة سريعة للحقيبة" : "Quick Add to Bag"}</span>
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-1.5">
          {displayCategory && (
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>{displayCategory}</span>
              {colorHex && (
                <span
                  className="size-3 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: colorHex }}
                  title={colorName || ""}
                />
              )}
            </div>
          )}

          <Link
            href={`/products/${slug}`}
            className="group/title block text-sm font-semibold text-foreground transition-colors hover:text-primary line-clamp-1"
          >
            <span className="inline-flex items-center gap-1">
              {displayTitle}
              <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover/title:opacity-100" />
            </span>
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-foreground">
              {price.toLocaleString()} {currency}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                {originalPrice.toLocaleString()} {currency}
              </span>
            )}
          </div>

          {/* Mobile quick add button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="sm:hidden flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            aria-label={isAr ? "إضافة للحقيبة" : "Add to bag"}
          >
            <ShoppingBag className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
