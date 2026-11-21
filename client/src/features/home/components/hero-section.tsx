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
    <section className="relative overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24 border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content Column */}
          <div className="md:col-span-6 space-y-6 text-start">
            <span className="inline-block text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold text-ds-text-soft">
              {t("hero.kicker")}
            </span>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-brand-serif font-normal text-ds-text-plain tracking-tight leading-[1.15]">
                {isRTL ? t("hero.subtitle") : t("hero.title")}
              </h1>
              <p className="text-xl sm:text-2xl font-medium text-ds-primary/90">
                {isRTL ? t("hero.title") : t("hero.subtitle")}
              </p>
            </div>

            <p className="text-sm sm:text-base text-ds-text-muted max-w-lg leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="pt-2">
              <Link
                href="/products/pleated-skirt"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow group cursor-pointer"
              >
                <span>{t("hero.cta")}</span>
                <span className="ms-2 opacity-70 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Visual Column with Real Modest Wear Photo and Botanical Accent */}
          <div className="md:col-span-6">
            <div className="relative aspect-4/5 md:aspect-5/6 w-full rounded-lg overflow-hidden bg-ds-secondary/30 shadow-sm border border-ds-border-subtle group">
              {/* Real Modest Fashion Image */}
              <Image
                src="/products/skirt/sky-blue.png"
                alt="MIRÉ Modest Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700"
              />

              {/* Botanical sprig artwork in top corner */}
              <div className="absolute top-6 end-6 text-white drop-shadow-md transition-transform group-hover:scale-110 duration-500 pointer-events-none">
                <BotanicalIcon size={76} />
              </div>

              {/* Subtle gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                <span className="text-[11px] uppercase tracking-[0.25em] text-white/90 font-medium">
                  {isRTL ? "مجموعة ميري الحصرية للأزياء المحتشمة" : "MIRÉ EXCLUSIVE MODEST COLLECTION"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
