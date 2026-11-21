"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/src/features/wishlist";
import { useCartStore } from "@/src/shared/stores/cart-store";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem, setIsOpen: setCartOpen } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: typeof items[0]) => {
    addItem({
      id: product.id,
      title: isRTL ? product.titleAr : product.titleEn,
      price: product.price,
      color: product.color || "Standard",
      size: "M",
      image: product.image,
    });

    toast.success(
      isRTL
        ? `تمت إضافة "${product.titleAr}" إلى حقيبة التسوق`
        : `Added "${product.titleEn}" to your bag`,
      {
        action: {
          label: isRTL ? "عرض الحقيبة" : "View Bag",
          onClick: () => setCartOpen(true),
        },
      }
    );
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="h-8 w-48 bg-zinc-200 rounded-md mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-3/4 bg-zinc-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 min-h-[70vh]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-ds-border-muted/50 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-ds-text-soft mb-2 font-medium">
            <Link href="/" className="hover:text-ds-primary transition-colors">
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <span>/</span>
            <span className="text-ds-text-plain font-semibold">
              {isRTL ? "قائمة الرغبات" : "Wishlist"}
            </span>
          </nav>
          <h1 className="font-brand-serif text-3xl sm:text-4xl text-ds-text-plain font-medium tracking-tight">
            {isRTL ? "قائمة رغباتي" : "My Wishlist"}
          </h1>
          <p className="text-xs sm:text-sm text-ds-text-muted mt-1 font-light">
            {isRTL
              ? "القطع المختارة التي أحببتِها، محفوظة لتسوق أسهل في أي وقت"
              : "Your saved favorites, ready whenever you wish to make them yours."}
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="text-xs text-ds-text-soft hover:text-destructive flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="size-3.5" />
            <span>{isRTL ? "مسح القائمة بالكامل" : "Clear all"}</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="size-20 rounded-full bg-ds-subtle flex items-center justify-center text-ds-primary/60 mb-6 border border-ds-border-subtle">
            <Heart className="size-9" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-ds-text-plain">
            {isRTL ? "قائمة الرغبات فارغة حالياً" : "Your wishlist is empty"}
          </h2>
          <p className="text-sm text-ds-text-muted mt-2 font-light leading-relaxed">
            {isRTL
              ? "استكشفي تشكيلات ميري وأضيفي القطع المفضلة لديكِ بالضغط على أيقونة القلب."
              : "Browse the MIRÉ editorial collection and save your favorite pieces with the heart icon."}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow-md"
          >
            <span>{isRTL ? "استكشفي المجموعة" : "Explore Collection"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {items.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl overflow-hidden border border-ds-border-subtle hover:border-ds-primary/30 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              {/* Product Image */}
              <div className="relative aspect-3/4 overflow-hidden bg-ds-secondary/15">
                <Link href={`/products/${product.slug}`} className="block w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={isRTL ? product.titleAr : product.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="absolute top-2.5 end-2.5 size-8 rounded-full bg-white/90 hover:bg-white text-zinc-600 hover:text-destructive flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title={isRTL ? "إزالة من القائمة" : "Remove"}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Product Details & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block text-sm font-semibold text-ds-text-plain group-hover:text-ds-primary transition-colors line-clamp-1"
                  >
                    {isRTL ? product.titleAr : product.titleEn}
                  </Link>
                  <p className="text-sm font-bold text-ds-text-plain">
                    {product.price} {isRTL ? "ج.م" : "EGP"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="w-full py-2.5 px-3 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ShoppingBag className="size-3.5" />
                  <span>{isRTL ? "أضيفي للحقيبة" : "Add to Bag"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
