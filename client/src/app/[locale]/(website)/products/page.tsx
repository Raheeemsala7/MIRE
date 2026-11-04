import React from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { ProductsCatalog } from "@/src/features/products/components/products-catalog";

interface ProductsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
      {/* ─── Breadcrumb Navigation ─── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-2 rtl:space-x-reverse text-xs uppercase tracking-widest text-ds-text-soft font-medium mb-6"
      >
        <Link href="/" className="hover:text-ds-primary transition-colors">
          {isRTL ? "الرئيسية" : "HOME"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ds-text-soft/60 rtl:rotate-180" />
        <span className="text-ds-text-plain font-semibold">
          {isRTL ? "جميع المنتجات والتشكيلات" : "ALL COLLECTIONS"}
        </span>
      </nav>

      {/* ─── Page Title Header ─── */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="text-xs uppercase tracking-[0.25em] text-ds-primary font-semibold">
          {isRTL ? "أزياء نسائية معاصرة محتشمة" : "CONTEMPORARY MODEST WOMENSWEAR"}
        </span>
        <h1 className="text-3xl sm:text-5xl font-brand-serif text-ds-text-plain">
          {isRTL ? "جميع تشكيلات ميري" : "All MIRÉ Collections"}
        </h1>
        <p className="text-xs sm:text-sm text-ds-text-muted leading-relaxed">
          {isRTL
            ? "استكشفي تشكيلتنا المتكاملة من الجيبات البليسيه المنسدلة، والأطقم المتناسقة، والعبايات المصممة بأقمشة طبيعية وقصات مفعمة بالثقة والهدوء."
            : "Explore our full range of fluid pleated skirts, curated Pantone modest sets, and elegant abayas crafted with quiet confidence."}
        </p>
      </div>

      {/* ─── Interactive Products Catalog Grid ─── */}
      <ProductsCatalog />
    </div>
  );
}

