import React from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BotanicalIcon } from "@/shared/components/botanical-icon";

export async function BrandStory() {
  const locale = await getLocale();
  const isRTL = locale === "ar";

  return (
    <section id="about" className="py-20 md:py-28 bg-muted/20 border-b border-border/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase font-semibold text-primary">
          {isRTL ? "فلسفة ميري" : "THE MIRÉ PHILOSOPHY"}
        </span>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-brand-serif font-normal text-foreground leading-relaxed">
          {isRTL
            ? "«نبتكر أزياء محتشمة تُصاغ بعناية، لتمنحكِ حضوراً راقياً وانسيابية تدوم طوال اليوم.»"
            : "“Understated silhouettes crafted with deliberate precision, offering quiet grace and enduring ease.”"}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {isRTL
            ? "أقمشة طبيعية منسدلة، وقصات محتشمة تمنحكِ الراحة والوقار في كل حركة."
            : "Natural fluid textiles, mindful drape, and calming palettes designed for timeless modest elegance."}
        </p>

        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary hover:underline underline-offset-8"
          >
            {isRTL ? "استكشفي التصاميم ←" : "Discover the Atelier →"}
          </Link>
        </div>
      </div>
    </section>
  );
}
