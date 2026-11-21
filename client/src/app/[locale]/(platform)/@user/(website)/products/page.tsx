import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { ProductsCatalog } from "@/features/products/components/products-catalog";
import { getPublicProducts } from "@/features/products/server/queries";
import type { Product } from "@/features/products/types/product.types";

interface ProductsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function ProductsContent({ params }: ProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  let products: Product[] = [];
  try {
    const res = await getPublicProducts({ limit: 50 });
    if (res?.data && Array.isArray(res.data)) {
      products = res.data;
    }
  } catch {
    // Graceful fallback to static products
  }

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
        <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-ds-text-plain">
          {isRTL ? "تشكيلة ميري الاستثنائية" : "The MIRÉ Collection"}
        </h1>
        <p className="text-sm md:text-base text-ds-text-soft font-light leading-relaxed">
          {isRTL
            ? "تصاميم منتقاة بعناية تجسد الأناقة الهادئة والأنوثة الراقية، مصنوعة من أقمشة طبيعية فاخرة."
            : "Thoughtfully curated modest essentials tailored in luxurious natural fibers for the discerning woman."}
        </p>
      </div>

      {/* ─── Interactive Products Catalog ─── */}
      <ProductsCatalog initialProducts={products} />
    </div>
  );
}

export default function ProductsPage({ params }: ProductsPageProps) {
  return (
    <Suspense fallback={null}>
      <ProductsContent params={params} />
    </Suspense>
  );
}
