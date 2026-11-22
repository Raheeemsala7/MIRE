import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublicRelatedProducts } from "../apis/products.api";
import { getPrimaryImageUrl } from "../utils/product.util";

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
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group block"
          >
            <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-ds-secondary/30 mb-4">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                unoptimized
              />
              <div className="absolute top-3 end-3">
                <span
                  className="size-3.5 rounded-full border border-white/60 shadow-xs block"
                  style={{ backgroundColor: item.swatchHex }}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium text-ds-text-plain group-hover:text-ds-primary transition-colors truncate">
                  {item.title}
                </h3>
                <span className="text-xs font-mono font-semibold text-ds-text-plain shrink-0">
                  {item.price} {t("common.currency")}
                </span>
              </div>
              <p className="text-xs text-ds-text-soft font-light">
                {item.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
