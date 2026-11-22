import React from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { getPublicRelatedProducts } from "../apis/products.api";
import { getPrimaryImageUrl } from "../utils/product.util";
import { ProductCard } from "./product-card";

interface RelatedProductsProps {
  productId?: string;
}

export async function RelatedProducts({ productId }: RelatedProductsProps = {}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  let relatedItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    price: number;
    swatchHex: string;
    image: string;
    slug: string;
  }> = [];

  if (productId) {
    try {
      const res = await getPublicRelatedProducts(productId, 3);
      if (res?.data && res.data.length > 0) {
        relatedItems = res.data.map((p) => ({
          id: p._id,
          title: p.name,
          subtitle: typeof p.category === "object" ? p.category.name : p.brand,
          price: p.discountPrice || p.price,
          swatchHex: p.colors?.[0]?.code || "#722236",
          image: getPrimaryImageUrl(p.images),
          slug: p.slug,
        }));
      }
    } catch {
      // Graceful fallback to curated selection
    }
  }

  if (relatedItems.length === 0) {
    relatedItems = [
      {
        id: "pleated-skirt-wine",
        title: isRTL ? "جيبة بليسيه - نبيذي" : "Pleated Skirt - Wine",
        subtitle: isRTL ? "تنورة ماكسي مكسرة" : "Maxi pleated skirt",
        price: 850,
        swatchHex: "#722236",
        image: "/products/skirt/wine.png",
        slug: "pleated-skirt",
      },
      {
        id: "pleated-skirt-camel",
        title: isRTL ? "جيبة بليسيه - جملي" : "Pleated Skirt - Camel",
        subtitle: isRTL ? "تنورة ماكسي مكسرة" : "Maxi pleated skirt",
        price: 850,
        swatchHex: "#c19a6b",
        image: "/products/skirt/camel.png",
        slug: "pleated-skirt",
      },
      {
        id: "abaya-classic",
        title: isRTL ? "عباية وشيلة كلاسيك" : "Classic Abaya & Hijab",
        subtitle: isRTL ? "أزياء محتشمة معاصرة" : "Contemporary modest set",
        price: 1250,
        swatchHex: "#2b282e",
        image: "/products/abaya.jpg",
        slug: "pleated-skirt",
      },
    ];
  }

  return (
    <section className="py-16 md:py-24 border-t border-ds-border-subtle">
      {/* Section Header */}
      <div className="flex items-baseline justify-between mb-10 pb-4 border-b border-ds-border-muted/40">
        <h2 className="text-2xl sm:text-3xl font-brand-serif text-ds-text-plain">
          {isRTL ? t("pdp.related.title") : t("pdp.related.titleEn")}
        </h2>
        <span className="text-xs uppercase tracking-widest text-ds-text-soft font-semibold">
          {isRTL ? "تشكيلة مختارة" : "Curated Selection"}
        </span>
      </div>

      {/* 3 Columns Grid with Real Modest Fashion Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
        {relatedItems.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            slug={item.slug}
            title={item.title}
            titleAr={item.title}
            category={item.subtitle}
            categoryAr={item.subtitle}
            price={item.price}
            image={item.image}
            colorHex={item.swatchHex}
          />
        ))}
      </div>
    </section>
  );
}
