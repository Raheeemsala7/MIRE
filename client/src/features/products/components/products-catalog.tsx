"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/shared/stores/cart-store";
import { ProductCard } from "./product-card";
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
  const { addItem, setIsOpen } = useCartStore();

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
        if (catSlug.includes("outfit") || catSlug.includes("set")) catType = "outfit";
        else if (catSlug.includes("abaya")) catType = "abaya";

        const rawImage = p.images?.[0];
        const imageUrl = typeof rawImage === "string" ? rawImage : rawImage?.url || "/products/skirt/sky-blue.png";
        const colorCode = p.colors?.[0]?.code || "#746078";

        return {
          id: p._id,
          slug: p.slug || "pleated-skirt",
          titleEn: p.name,
          titleAr: p.name,
          category: catType,
          categoryLabelEn: catType === "skirt" ? "Skirts" : catType === "outfit" ? "Sets" : "Abayas",
          categoryLabelAr: catType === "skirt" ? "جيبات" : catType === "outfit" ? "أطقم" : "عبايات",
          price: p.discountPrice || p.price,
          swatchHex: colorCode,
          image: imageUrl,
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
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            title={product.titleEn}
            titleAr={product.titleAr}
            category={product.categoryLabelEn}
            categoryAr={product.categoryLabelAr}
            price={product.price}
            image={product.image}
            colorHex={product.swatchHex}
          />
        ))}
      </div>
    </div>
  );
}
