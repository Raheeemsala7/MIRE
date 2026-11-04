import React from "react";
import { getTranslations, getLocale } from "next-intl/server";

export async function ValuePillars() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const pillars = [
    {
      title: isRTL ? t("pillars.naturalFabrics.title") : t("pillars.naturalFabrics.titleEn"),
      desc: t("pillars.naturalFabrics.desc"),
    },
    {
      title: isRTL ? t("pillars.consideredCuts.title") : t("pillars.consideredCuts.titleEn"),
      desc: t("pillars.consideredCuts.desc"),
    },
    {
      title: isRTL ? t("pillars.quietlyMade.title") : t("pillars.quietlyMade.titleEn"),
      desc: t("pillars.quietlyMade.desc"),
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-ds-plain border-b border-ds-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-start">
          {pillars.map((p, idx) => (
            <div key={idx} className="space-y-2 border-s-2 border-ds-secondary/60 ps-4 md:border-s-0 md:ps-0">
              <h3 className="text-base sm:text-lg font-brand-serif font-medium text-ds-text-plain">
                {p.title}
              </h3>
              <p className="text-xs sm:text-sm text-ds-text-muted leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
