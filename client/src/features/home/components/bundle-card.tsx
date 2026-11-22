"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ShoppingBag, Sparkles, Check, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/shared/stores/cart-store";

export interface BundleDisplayItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  savingsAmount?: number;
  piecesCount?: number;
  includedItems?: string[];
  swatchHex?: string;
  image: string;
}

export function BundleCard({ bundle }: { bundle: BundleDisplayItem }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const currency = isRTL ? "ج.م" : "EGP";

  const { addItem, setIsOpen } = useCartStore();

  const handleAddBundleToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: bundle.id,
      title: bundle.title,
      price: bundle.price,
      color: isRTL ? "تنسيق متناسق" : "Curated Look",
      size: "M",
      image: bundle.image,
    });

    toast.success(
      isRTL
        ? `تمت إضافة "${bundle.title}" إلى حقيبة التسوق بنجاح!`
        : `Added "${bundle.title}" to your shopping bag!`,
      {
        action: {
          label: isRTL ? "عرض الحقيبة" : "View Bag",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  const savings =
    bundle.savingsAmount ||
    (bundle.originalPrice && bundle.originalPrice > bundle.price
      ? bundle.originalPrice - bundle.price
      : 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-lg transition-all duration-300">
      {/* Image & Badges Frame */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-muted/20">
        <Link href={`/products/${bundle.slug}`} className="block size-full">
          <Image
            src={bundle.image}
            alt={bundle.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute inset-x-3.5 top-3.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col gap-1.5 items-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase shadow-sm">
              <Sparkles className="size-3" />
              <span>{isRTL ? "طقم متكامل" : "BUNDLE SET"}</span>
            </span>
            {savings > 0 && (
              <span className="rounded-full bg-emerald-600/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                {isRTL ? `وفّري ${savings.toLocaleString()} ج.م` : `Save ${savings.toLocaleString()} EGP`}
              </span>
            )}
          </div>

          {bundle.swatchHex && (
            <span
              className="size-4 rounded-full border-2 border-white shadow-sm pointer-events-auto"
              style={{ backgroundColor: bundle.swatchHex }}
              title={bundle.title}
            />
          )}
        </div>
      </div>

      {/* Bundle Info & Action */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {bundle.piecesCount && (
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
              {isRTL ? `يشمل ${bundle.piecesCount} قطع متناسقة` : `${bundle.piecesCount}-Piece Coordinated Set`}
            </span>
          )}

          <Link
            href={`/products/${bundle.slug}`}
            className="group/title block text-base font-brand-serif font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            <span className="inline-flex items-center gap-1">
              {bundle.title}
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/title:opacity-100" />
            </span>
          </Link>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {bundle.subtitle}
          </p>

          {bundle.includedItems && bundle.includedItems.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1.5">
              {bundle.includedItems.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                >
                  <Check className="size-2.5 text-primary" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Add Bundle Button */}
        <div className="pt-3 border-t border-border/50 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold text-foreground">
                {bundle.price.toLocaleString()} {currency}
              </span>
              {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                <span className="font-mono text-xs text-muted-foreground line-through">
                  {bundle.originalPrice.toLocaleString()} {currency}
                </span>
              )}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {isRTL ? "سعر العرض الخاص" : "Special Bundle Price"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground py-2.5 px-4 text-xs font-semibold tracking-wider transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer active:scale-98"
          >
            <ShoppingBag className="size-3.5" />
            <span>{isRTL ? "أضيفي الطقم كاملاً للحقيبة" : "Add Complete Bundle to Bag"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
