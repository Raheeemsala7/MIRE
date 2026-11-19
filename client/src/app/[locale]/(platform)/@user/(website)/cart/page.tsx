import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "حقيبة التسوق | ميري" : "Shopping Bag | MIRÉ",
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-6 py-16 sm:px-10">
      <div className="flex items-center gap-3 border-b border-ds-border-muted pb-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {isAr ? "حقيبة التسوق" : "Shopping Bag"}
          </h1>
          <p className="mt-1 text-sm text-ds-text-muted">
            {isAr ? "راجعي اختياراتك قبل إتمام الطلب" : "Review your curated pieces before checkout"}
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-ds-elevated/40 p-12 text-center">
        <ShoppingBag className="size-12 text-ds-text-soft" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl text-ds-text-plain">
          {isAr ? "حقيبة التسوق فارغة" : "Your bag is currently empty"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-ds-text-muted">
          {isAr
            ? "اكتشفي تصاميمنا المميزة واختاري ما يناسب إطلالتك."
            : "Discover our contemporary modest silhouettes and find something you love."}
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ds-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
        >
          <span>{isAr ? "استكشاف المجموعة" : "Explore the collection"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
