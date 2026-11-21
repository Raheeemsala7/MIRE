import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";

export async function OutfitsGallery() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const outfits = [
    {
      id: "outfit-yellow-jasper",
      pantone: "PANTONE® 12-0718 TCX",
      pantoneName: "Yellow Jasper",
      title: isRTL ? "طقم يلو جاسبر وجيبة بليسيه بيضاء" : "Yellow Jasper Tunic & White Pleated Skirt",
      subtitle: isRTL ? "تونيك خردلي متموج مع جيبة بيضاء مكسرة" : "Wavy tunic with crisp white pleated skirt",
      price: 1350,
      hex: "#e5d158",
      image: "/products/outfits/yellow-jasper.jpg",
      slug: "pleated-skirt",
    },
    {
      id: "outfit-tapioca-brown",
      pantone: "PANTONE® 13-1008 TCX",
      pantoneName: "Tapioca",
      title: isRTL ? "طقم التابيوكا وجيبة بليسيه بنية" : "Tapioca Neutral Set & Brown Pleated Skirt",
      subtitle: isRTL ? "أناقة هادئة بألوان الأرض والقهوة" : "Earthy mocha & chocolate pleated harmony",
      price: 1350,
      hex: "#d8c8b4",
      image: "/products/outfits/tapioca-brown.jpg",
      slug: "pleated-skirt",
    },
    {
      id: "outfit-burgundy-cream",
      pantone: "PANTONE® 18-1618 TCX",
      pantoneName: "Chili Pepper",
      title: isRTL ? "طقم تشيلي بيبر وجيبة عاجية" : "Chili Pepper Tunic & Cream Pleated Skirt",
      subtitle: isRTL ? "نبيذي داكن فاخر مع جيبة عاجية منسدلة" : "Rich burgundy tunic with flowing cream skirt",
      price: 1350,
      hex: "#852934",
      image: "/products/outfits/burgundy-cream.jpg",
      slug: "pleated-skirt",
    },
    {
      id: "outfit-teal-denim",
      pantone: "PANTONE® 19-4535 TCX",
      pantoneName: "Teal-Blue Denim",
      title: isRTL ? "طقم التيل دينيم وجيبة بترولية" : "Teal Blue Denim Skirt & White Tunic",
      subtitle: isRTL ? "تونيك أبيض ناصع مع جيبة كحلي بترولي" : "Crisp white drape over deep teal pleated maxi",
      price: 1350,
      hex: "#274e5e",
      image: "/products/outfits/teal-denim.jpg",
      slug: "pleated-skirt",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-ds-subtle/50 border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-12 pb-4 border-b border-ds-border-muted/50 gap-4">
          <div>
            <div className="flex items-center gap-2 text-ds-primary text-xs uppercase tracking-widest font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{isRTL ? "تنسيقات ميري الحصرية" : "MIRÉ CURATED PALETTES"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-brand-serif text-ds-text-plain">
              {isRTL ? "أطقم وتنسيقات البليسيه والمحجبات" : "Pantone Modest Outfit Sets"}
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs uppercase tracking-widest font-semibold text-ds-primary hover:text-ds-primary-saturated transition-colors shrink-0"
          >
            {isRTL ? "تسوقي جميع الأطقم ←" : "SHOP ALL SETS →"}
          </Link>
        </div>

        {/* 4 Large Full-Outfit Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {outfits.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.slug}`}
              className="group block bg-white rounded-lg overflow-hidden border border-ds-border-subtle hover:border-ds-primary/40 transition-all duration-300 shadow-xs hover:shadow-md"
            >
              {/* Full Outfit Image Container */}
              <div className="relative aspect-3/4 overflow-hidden bg-ds-secondary/20">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-104 transition-transform duration-700"
                />

                {/* Subtle Pantone chip overlay */}
                <div className="absolute top-3 start-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-sm shadow-xs border border-black/5 flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="text-[10px] font-mono font-medium text-zinc-800">
                    {item.pantoneName}
                  </span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-2">
                <div className="text-[11px] font-mono text-ds-text-soft">
                  {item.pantone}
                </div>
                <h3 className="text-sm font-semibold text-ds-text-plain group-hover:text-ds-primary transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-ds-text-muted line-clamp-1">
                  {item.subtitle}
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                  <span className="text-sm font-bold text-ds-text-plain">
                    {item.price} {t("common.currency")}
                  </span>
                  <span className="text-xs font-semibold text-ds-primary group-hover:underline">
                    {isRTL ? "عرض التفاصيل" : "View Look"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

