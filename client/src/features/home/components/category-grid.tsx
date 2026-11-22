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
    <section id="collections" className="py-12 md:py-20 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8 pb-3 border-b border-border/40">
          <h2 className="text-2xl sm:text-3xl font-brand-serif text-foreground font-normal">
            {isRTL ? "التصنيفات المختارة" : "Curated Silhouettes"}
          </h2>
          <Link
            href="/products"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            {isRTL ? "عرض الكل" : "View All"}
          </Link>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href="/products"
              className="group block"
            >
              <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-muted/30 border border-border/40 group-hover:border-primary/40 transition-all duration-500 shadow-2xs group-hover:shadow-md">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                  className="object-cover group-hover:scale-104 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Category Name Below */}
              <div className="mt-3 px-1 text-start">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
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
