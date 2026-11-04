import React from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { BotanicalIcon } from "@/src/shared/components/botanical-icon";

export async function BrandStory() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  return (
    <section id="about" className="py-20 md:py-28 bg-ds-secondary/35 relative overflow-hidden border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Visual Column with Real Modest Outfit Photo & Botanical Icon */}
          <div className="md:col-span-5 flex items-center justify-center relative">
            <div className="relative w-full max-w-sm aspect-4/5 rounded-lg overflow-hidden shadow-md border border-white/60 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/outfits/tapioca-brown.jpg"
                alt="MIRÉ Modest Philosophy"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 end-4 text-white drop-shadow-md">
                <BotanicalIcon size={48} />
              </div>
            </div>
          </div>

          {/* Story Narrative Column */}
          <div className="md:col-span-7 space-y-6 text-start">
            <span className="inline-block text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold text-ds-primary">
              {t("approach.kicker")}
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-brand-serif text-ds-text-plain tracking-tight leading-snug">
              {isRTL ? t("approach.titleAr") : t("approach.title")}
            </h2>

            <p className="text-sm sm:text-base text-ds-text-plain/85 leading-relaxed max-w-xl">
              {t("approach.story")}
            </p>

            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow cursor-pointer"
              >
                {t("approach.cta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
