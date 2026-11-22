import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { ProductView } from "@/features/products/components/product-view";
import { RelatedProducts } from "@/features/products/components/related-products";
import { ProductDetail } from "@/features/products/types/product";
import { getPublicProductBySlug } from "@/features/products/apis/products.api";

interface ProductPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export function generateStaticParams() {
  return [
    { locale: "ar", slug: "pleated-skirt" },
    { locale: "en", slug: "pleated-skirt" },
  ];
}

const fallbackProductData: ProductDetail = {
  id: "pleated-skirt",
  slug: "pleated-skirt",
  categoryEn: "SKIRT",
  categoryAr: "جيبة",
  titleEn: "Pleated Maxi Skirt",
  titleAr: "جيبة بليسيه",
  price: 850,
  descriptionEn:
    "A fluid pleated maxi skirt with an elasticated waist, cut to fall softly and move with you.",
  descriptionAr:
    "جيبة ماكسي بليسيه منسدلة مع خصر مطاطي مريح، مصممة لتتحرك بنعومة وانسيابية معكِ في كل خطوة.",
  colors: [
    {
      id: "sky-blue",
      nameEn: "Sky Blue",
      nameAr: "سماوي",
      hex: "#9ec1df",
      image: "/products/skirt/sky-blue.png",
    },
    {
      id: "wine",
      nameEn: "Wine",
      nameAr: "نبيذي",
      hex: "#722236",
      image: "/products/skirt/wine.png",
    },
    {
      id: "camel",
      nameEn: "Camel",
      nameAr: "جملي",
      hex: "#c19a6b",
      image: "/products/skirt/camel.png",
    },
  ],
  sizes: ["S", "M", "L", "XL"],
};

async function ProductDetailContent({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  let product = fallbackProductData;
  let productId: string | undefined = undefined;

  try {
    const res = await getPublicProductBySlug(slug);
    if (res?.data) {
      const p = res.data;
      productId = p._id;
      product = {
        id: p._id,
        slug: p.slug,
        categoryEn: typeof p.category === "object" ? p.category.name : "Collection",
        categoryAr: typeof p.category === "object" ? p.category.name : "تشكيلة",
        titleEn: p.name,
        titleAr: p.name,
        price: p.discountPrice || p.price,
        descriptionEn: p.description,
        descriptionAr: p.description,
        colors: p.colors?.length
          ? p.colors.map((c: any, i: number) => ({
              id: c.name.toLowerCase().replace(/\s+/g, "-"),
              nameEn: c.name,
              nameAr: c.name,
              hex: c.code,
              image: p.images?.[i]?.url || p.images?.[0]?.url || "/products/skirt/sky-blue.png",
            }))
          : [
              {
                id: "default",
                nameEn: "Standard",
                nameAr: "افتراضي",
                hex: "#18181b",
                image: p.images?.[0]?.url || "/products/skirt/sky-blue.png",
              },
            ],
        sizes: p.sizes || ["S", "M", "L"],
      };
    }
  } catch {
    // If not found in backend or static dummy slug "pleated-skirt", keep fallback
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* ─── Breadcrumb Navigation ─── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-2 rtl:space-x-reverse text-xs uppercase tracking-widest text-ds-text-soft font-medium mb-8"
      >
        <Link href="/" className="hover:text-ds-primary transition-colors">
          {isRTL ? "الرئيسية" : "HOME"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ds-text-soft/60 rtl:rotate-180" />
        <Link href="/products" className="hover:text-ds-primary transition-colors">
          {isRTL ? "المنتجات" : "PRODUCTS"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ds-text-soft/60 rtl:rotate-180" />
        <span className="text-ds-text-plain font-semibold">
          {isRTL ? product.titleAr : product.titleEn}
        </span>
      </nav>

      {/* ─── Product Main View (Gallery + Info + CTAs) ─── */}
      <ProductView product={product} />

      {/* ─── Related Products ─── */}
      <RelatedProducts productId={productId} />
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={null}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
