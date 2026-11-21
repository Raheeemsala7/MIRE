import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function CategoryGrid() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const categories = [
    {
      slug: "abaya",
      name: isRTL ? "عباية" : "Abaya",
      image: "/products/abaya.jpg",
    },
    {
      slug: "khimar",
      name: isRTL ? "خمار" : "Khimar",
      image: "/products/skirt/wine.png",
    },
    {
      slug: "isdal",
      name: isRTL ? "إسدال" : "Isdal",
      image: "/products/skirt/camel.png",
    },
    {
      slug: "gilba",
      name: isRTL ? "جبة وتنورة" : "Gilba & Skirt",
      image: "/products/skirt/sky-blue.png",
    },
  ];

  return (
    <section id="collections" className="py-16 md:py-24 border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-10 pb-4 border-b border-ds-border-muted/40">
          <h2 className="text-2xl sm:text-3xl font-brand-serif text-ds-text-plain">
            {isRTL ? t("categories.titleAr") : t("categories.title")}
          </h2>
          <span className="text-xs uppercase tracking-widest text-ds-text-soft font-semibold">
            {isRTL ? "تشكيلة الموسم" : "Season Collection"}
          </span>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href="/products/pleated-skirt"
              className="group block"
            >
              <div className="relative aspect-3/4 rounded-md overflow-hidden bg-ds-secondary/20 border border-transparent group-hover:border-ds-primary/30 transition-all duration-300 shadow-2xs group-hover:shadow-md">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              </div>

              {/* Category Name Below */}
              <div className="mt-3 px-1 text-center sm:text-start">
                <span className="text-sm sm:text-base font-medium text-ds-text-plain group-hover:text-ds-primary transition-colors">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
