import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BotanicalIcon } from "@/shared/components/botanical-icon";

export async function HeroSection() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  return (
    <section className="relative overflow-hidden py-10 md:py-20 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Text Content Column */}
          <div className="md:col-span-6 space-y-6 text-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-2xs">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>{isRTL ? "ميري للأزياء الراقية" : "MIRÉ Modest Couture"}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-brand-serif font-normal text-foreground tracking-tight leading-[1.15]">
                {isRTL ? "الزهور فقط ترتدي ميري" : "Only Flowers Wear MIRÉ"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed font-normal">
                {isRTL
                  ? "أناقة محتشمة، بهدوء معاصر وتصاميم منسدلة تُجسد الوقار والراحة اليومية."
                  : "Refined fluid silhouettes and natural fabrics crafted for enduring comfort and quiet confidence."}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow group cursor-pointer"
              >
                <span>{isRTL ? "اكتشفي التشكيلة" : "Explore Collection"}</span>
                <span className="ms-2 opacity-70 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Visual Column with Clean Modest Wear Photo */}
          <div className="md:col-span-6">
            <div className="relative aspect-4/5 md:aspect-5/6 w-full rounded-3xl overflow-hidden bg-muted/30 shadow-sm border border-border/50 group">
              <Image
                src="/products/skirt/sky-blue.png"
                alt="MIRÉ Modest Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
