"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/shared/stores/cart-store";
import type { Product } from "../types/product.types";

export interface CatalogProduct {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  category: "skirt" | "outfit" | "abaya";
  categoryLabelEn: string;
  categoryLabelAr: string;
  price: number;
  swatchHex: string;
  image: string;
}

const ALL_PRODUCTS: CatalogProduct[] = [
  {
    id: "skirt-sky-blue",
    slug: "pleated-skirt",
    titleEn: "Pleated Maxi Skirt - Sky Blue",
    titleAr: "جيبة بليسيه ماكسي - سماوي",
    category: "skirt",
    categoryLabelEn: "Skirts",
    categoryLabelAr: "جيبات بليسيه",
    price: 850,
    swatchHex: "#9ec1df",
    image: "/products/skirt/sky-blue.png",
  },
  {
    id: "skirt-wine",
    slug: "pleated-skirt",
    titleEn: "Pleated Maxi Skirt - Wine",
    titleAr: "جيبة بليسيه ماكسي - نبيذي",
    category: "skirt",
    categoryLabelEn: "Skirts",
    categoryLabelAr: "جيبات بليسيه",
    price: 850,
    swatchHex: "#722236",
    image: "/products/skirt/wine.png",
  },
  {
    id: "skirt-camel",
    slug: "pleated-skirt",
    titleEn: "Pleated Maxi Skirt - Camel",
    titleAr: "جيبة بليسيه ماكسي - جملي",
    category: "skirt",
    categoryLabelEn: "Skirts",
    categoryLabelAr: "جيبات بليسيه",
    price: 850,
    swatchHex: "#c19a6b",
    image: "/products/skirt/camel.png",
  },
  {
    id: "outfit-yellow-jasper",
    slug: "pleated-skirt",
    titleEn: "Yellow Jasper Set (White Pleated Skirt)",
    titleAr: "طقم يلو جاسبر وجيبة بليسيه بيضاء",
    category: "outfit",
    categoryLabelEn: "Modest Sets",
    categoryLabelAr: "أطقم متناسقة",
    price: 1350,
    swatchHex: "#e5d158",
    image: "/products/outfits/yellow-jasper.jpg",
  },
  {
    id: "outfit-tapioca-brown",
    slug: "pleated-skirt",
    titleEn: "Tapioca Neutral Set (Brown Pleated Skirt)",
    titleAr: "طقم التابيوكا وجيبة بليسيه بنية",
    category: "outfit",
    categoryLabelEn: "Modest Sets",
    categoryLabelAr: "أطقم متناسقة",
    price: 1350,
    swatchHex: "#d8c8b4",
    image: "/products/outfits/tapioca-brown.jpg",
  },
  {
    id: "outfit-burgundy-cream",
    slug: "pleated-skirt",
    titleEn: "Chili Pepper Set (Cream Pleated Skirt)",
    titleAr: "طقم تشيلي بيبر النبيذي وجيبة عاجية",
    category: "outfit",
    categoryLabelEn: "Modest Sets",
    categoryLabelAr: "أطقم متناسقة",
    price: 1350,
    swatchHex: "#852934",
    image: "/products/outfits/burgundy-cream.jpg",
  },
  {
    id: "outfit-teal-denim",
    slug: "pleated-skirt",
    titleEn: "Teal Denim Set (Petrol Blue Skirt & White Tunic)",
    titleAr: "طقم التيل دينيم وتونيك أبيض وجيبة بترولية",
    category: "outfit",
    categoryLabelEn: "Modest Sets",
    categoryLabelAr: "أطقم متناسقة",
    price: 1350,
    swatchHex: "#274e5e",
    image: "/products/outfits/teal-denim.jpg",
  },
  {
    id: "abaya-classic-set",
    slug: "pleated-skirt",
    titleEn: "Classic Abaya & Hijab Crepe Set",
    titleAr: "طقم عباية وشيلة كلاسيك من الكريب",
    category: "abaya",
    categoryLabelEn: "Abayas",
    categoryLabelAr: "عبايات",
    price: 1250,
    swatchHex: "#2b282e",
    image: "/products/abaya.jpg",
  },
];

interface ProductsCatalogProps {
  initialProducts?: Product[];
}

export function ProductsCatalog({ initialProducts }: ProductsCatalogProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const addItem = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const filterTabs = [
    { key: "all", label: isRTL ? "جميع المنتجات" : "All Products" },
    { key: "skirt", label: isRTL ? "جيبات بليسيه" : "Pleated Skirts" },
    { key: "outfit", label: isRTL ? "أطقم متناسقة" : "Curated Sets" },
    { key: "abaya", label: isRTL ? "عبايات وشيلات" : "Abayas & Hijabs" },
  ];

  const allItems: CatalogProduct[] = React.useMemo(() => {
    if (initialProducts && initialProducts.length > 0) {
      return initialProducts.map((p) => {
        const catSlug = typeof p.category === "object" ? p.category.slug : "skirt";
        let catType: "skirt" | "outfit" | "abaya" = "skirt";
        if (catSlug.includes("abaya")) catType = "abaya";
        else if (catSlug.includes("outfit") || catSlug.includes("set") || catSlug.includes("dress")) catType = "outfit";

        return {
          id: p._id,
          slug: p.slug,
          titleEn: p.name,
          titleAr: p.name,
          category: catType,
          categoryLabelEn: typeof p.category === "object" ? p.category.name : "Collection",
          categoryLabelAr: typeof p.category === "object" ? p.category.name : "تشكيلة",
          price: p.discountPrice || p.price,
          swatchHex: p.colors?.[0]?.code || "#9ec1df",
          image: p.images?.[0]?.url || "/products/skirt/sky-blue.png",
        };
      });
    }
    return ALL_PRODUCTS;
  }, [initialProducts]);

  const filteredProducts =
    selectedCategory === "all"
      ? allItems
      : allItems.filter((p) => p.category === selectedCategory);

  const handleQuickAdd = (product: CatalogProduct) => {
    addItem({
      id: product.id,
      title: isRTL ? product.titleAr : product.titleEn,
      price: product.price,
      color: isRTL ? "اللون المعروض" : "Featured Color",
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
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  return (
    <div className="space-y-10">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {filterTabs.map((tab) => {
          const isSelected = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? "bg-ds-primary text-white shadow-xs"
                  : "bg-white text-ds-text-plain border border-ds-border-muted hover:border-ds-primary/60"
              }`}
            >
              {tab.label}
              {isSelected && <span className="ms-1.5 opacity-80">({filteredProducts.length})</span>}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group bg-white rounded-lg overflow-hidden border border-ds-border-subtle hover:border-ds-primary/40 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            {/* Image Container with Link */}
            <Link
              href={`/products/${product.slug}`}
              className="relative aspect-3/4 overflow-hidden bg-ds-secondary/20 block"
            >
              <Image
                src={product.image}
                alt={isRTL ? product.titleAr : product.titleEn}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-104 transition-transform duration-700"
              />
              <span
                className="absolute top-3 end-3 w-4 h-4 rounded-full border border-black/10 shadow-xs"
                style={{ backgroundColor: product.swatchHex }}
              />
            </Link>

            {/* Information & Action */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-ds-text-soft font-medium">
                  {isRTL ? product.categoryLabelAr : product.categoryLabelEn}
                </span>
                <Link
                  href={`/products/${product.slug}`}
                  className="block text-sm font-semibold text-ds-text-plain group-hover:text-ds-primary transition-colors line-clamp-1"
                >
                  {isRTL ? product.titleAr : product.titleEn}
                </Link>
                <div className="text-sm font-bold text-ds-text-plain pt-1">
                  {product.price} {t("currency")}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdd(product)}
                  className="flex-1 py-2.5 px-3 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isRTL ? "أضيفي للحقيبة" : "Add to Bag"}</span>
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  className="py-2.5 px-3 rounded-full border border-ds-border-muted hover:border-ds-primary text-ds-text-plain hover:text-ds-primary text-xs font-semibold transition-colors"
                >
                  {isRTL ? "التفاصيل" : "View"}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
