import React from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { ProductCard } from "@/features/products";

export async function NewArrivals() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const products = [
    {
      id: "abaya-charcoal",
      title: isRTL ? "عباية وشيلة - فحمية" : "Abaya & Hijab - Charcoal",
      subtitle: isRTL ? "خامة كريب فاخرة" : "Premium crepe fabric",
      price: 1250,
      swatchHex: "#2b282e",
      swatchName: isRTL ? "فحمي" : "Charcoal",
      image: "/products/abaya.jpg",
      slug: "pleated-skirt",
    },
    {
      id: "skirt-wine",
      title: isRTL ? "جيبة بليسيه - نبيذي" : "Pleated Skirt - Wine",
      subtitle: isRTL ? "تويل ياباني ناعم" : "Fluid Japanese twill",
      price: 850,
      swatchHex: "#722236",
      swatchName: isRTL ? "نبيذي" : "Wine",
      image: "/products/skirt/wine.png",
      slug: "pleated-skirt",
    },
    {
      id: "skirt-camel",
      title: isRTL ? "جيبة بليسيه - جملي" : "Pleated Skirt - Camel",
      subtitle: isRTL ? "خصر مطاطي مريح" : "Elasticated waist",
      price: 850,
      swatchHex: "#c19a6b",
      swatchName: isRTL ? "جملي" : "Camel",
      image: "/products/skirt/camel.png",
      slug: "pleated-skirt",
    },
    {
      id: "skirt-sky-blue",
      title: isRTL ? "جيبة بليسيه - سماوي" : "Pleated Skirt - Sky Blue",
      subtitle: isRTL ? "كسرات دائمة أنيقة" : "Permanent micro-pleats",
      price: 850,
      swatchHex: "#9ec1df",
      swatchName: isRTL ? "سماوي" : "Sky Blue",
      image: "/products/skirt/sky-blue.png",
      slug: "pleated-skirt",
    },
  ];

  return (
    <section id="new-arrivals" className="py-16 md:py-24 border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-10 pb-4 border-b border-ds-border-muted/40">
          <h2 className="text-2xl sm:text-3xl font-brand-serif text-ds-text-plain">
            {isRTL ? t("newArrivals.titleAr") : t("newArrivals.title")}
          </h2>
          <Link
            href="/products/pleated-skirt"
            className="text-xs uppercase tracking-widest font-semibold text-ds-text-muted hover:text-ds-primary transition-colors"
          >
            {t("newArrivals.viewAll")}
          </Link>
        </div>

        {/* 4 Cards Grid with Real Modest Wear Photos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              slug={item.slug}
              title={item.title}
              titleAr={item.title}
              price={item.price}
              image={item.image}
              colorHex={item.swatchHex}
              colorName={item.swatchName}
              category={isRTL ? "مجموعة الموسم" : "Season Essential"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
