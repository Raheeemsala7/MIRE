import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function RelatedProducts() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const related = [
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
        {related.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group block"
          >
            <div className="relative aspect-3/4 rounded-md overflow-hidden bg-ds-secondary/20 border border-transparent group-hover:border-ds-primary/30 transition-all duration-300 shadow-2xs group-hover:shadow-md">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
            </div>

            {/* Information */}
            <div className="mt-3 space-y-1 px-0.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-ds-text-plain group-hover:text-ds-primary transition-colors">
                  {item.title}
                </h3>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 mt-0.5"
                  style={{ backgroundColor: item.swatchHex }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-ds-text-muted">
                <span>
                  {item.price} {t("common.currency")}
                </span>
                <span className="text-[11px] text-ds-text-soft">
                  {item.subtitle}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
