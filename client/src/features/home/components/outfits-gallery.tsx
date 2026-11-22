import React from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { getPublicBundles } from "@/features/bundles/apis/bundles.api";
import { BundleCard, type BundleDisplayItem } from "./bundle-card";

export async function OutfitsGallery() {
  const locale = await getLocale();
  const isRTL = locale === "ar";

  let bundlesData: BundleDisplayItem[] = [];

  try {
    const rawBundles = await getPublicBundles(4);
    if (rawBundles && rawBundles.length > 0) {
      bundlesData = rawBundles.map((b) => {
        const primaryImage =
          b.bannerImage ||
          (typeof b.eligibleProducts?.[0] === "object" && (b.eligibleProducts[0] as any)?.images?.[0]?.url) ||
          "/products/outfits/yellow-jasper.jpg";

        const pieces = b.requiredQuantity || b.eligibleProducts?.length || 2;
        const discount = b.discountPercentage || 15;
        const price = b.bundlePrice || 1350;
        const originalPrice = Math.round(price / (1 - discount / 100));

        return {
          id: b._id,
          slug: b.slug || "pleated-skirt",
          title: b.title,
          subtitle: b.description,
          price,
          originalPrice,
          discountPercentage: discount,
          savingsAmount: originalPrice - price,
          piecesCount: pieces,
          includedItems: [
            isRTL ? "تونيك منسدل فاخر" : "Fluid Modest Tunic",
            isRTL ? "جيبة بليسيه ماكسي" : "Maxi Pleated Skirt",
          ],
          image: primaryImage,
        };
      });
    }
  } catch {
    // Fallback to curated collections below
  }

  // Graceful fallback if database has no active bundles seeded yet
  if (bundlesData.length === 0) {
    bundlesData = [
      {
        id: "bundle-yellow-jasper",
        slug: "pleated-skirt",
        title: isRTL ? "طقم يلو جاسبر وجيبة بليسيه بيضاء" : "Yellow Jasper Tunic & White Pleated Skirt Set",
        subtitle: isRTL
          ? "تونيك خردلي متموج مع جيبة بيضاء مكسرة ناصعة وقماش ياباني بارد."
          : "Wavy mustard fluid tunic with crisp white pleated maxi skirt.",
        price: 1350,
        originalPrice: 1600,
        discountPercentage: 15,
        savingsAmount: 250,
        piecesCount: 2,
        includedItems: [
          isRTL ? "تونيك يلو جاسبر متموج" : "Yellow Jasper Tunic",
          isRTL ? "جيبة بليسيه ماكسي بيضاء" : "White Pleated Skirt",
        ],
        swatchHex: "#e5d158",
        image: "/products/outfits/yellow-jasper.jpg",
      },
      {
        id: "bundle-tapioca-brown",
        slug: "pleated-skirt",
        title: isRTL ? "طقم التابيوكا وجيبة بليسيه بنية" : "Tapioca Neutral Set & Brown Pleated Skirt",
        subtitle: isRTL
          ? "أناقة هادئة بألوان الأرض والقهوة مع خصر مطاطي مريح للغاية."
          : "Earthy mocha & chocolate pleated harmony with relaxed fit.",
        price: 1350,
        originalPrice: 1600,
        discountPercentage: 15,
        savingsAmount: 250,
        piecesCount: 2,
        includedItems: [
          isRTL ? "تونيك تابيوكا ناعم" : "Tapioca Fluid Top",
          isRTL ? "جيبة بليسيه بنية شوكولاتة" : "Brown Pleated Maxi",
        ],
        swatchHex: "#d8c8b4",
        image: "/products/outfits/tapioca-brown.jpg",
      },
      {
        id: "bundle-burgundy-cream",
        slug: "pleated-skirt",
        title: isRTL ? "طقم تشيلي بيبر وجيبة عاجية" : "Chili Pepper Tunic & Cream Pleated Skirt",
        subtitle: isRTL
          ? "نبيذي داكن ملكي مع جيبة عاجية منسدلة بكسرات دقيقة تدوم للأبد."
          : "Rich burgundy tunic with flowing cream micro-pleated skirt.",
        price: 1350,
        originalPrice: 1600,
        discountPercentage: 15,
        savingsAmount: 250,
        piecesCount: 2,
        includedItems: [
          isRTL ? "تونيك نبيذي ملكي" : "Chili Pepper Tunic",
          isRTL ? "جيبة بليسيه عاجية منسدلة" : "Cream Pleated Skirt",
        ],
        swatchHex: "#852934",
        image: "/products/outfits/burgundy-cream.jpg",
      },
      {
        id: "bundle-teal-denim",
        slug: "pleated-skirt",
        title: isRTL ? "طقم التيل دينيم وجيبة بترولية" : "Teal Blue Denim Skirt & White Tunic Set",
        subtitle: isRTL
          ? "تونيك أبيض ناصع مع جيبة كحلي بترولي جذابة للمناسبات والعمل."
          : "Crisp white drape over deep teal pleated maxi skirt.",
        price: 1350,
        originalPrice: 1600,
        discountPercentage: 15,
        savingsAmount: 250,
        piecesCount: 2,
        includedItems: [
          isRTL ? "تونيك أبيض ناصع" : "Pure White Tunic",
          isRTL ? "جيبة بليسيه بترولية ماكسي" : "Teal Blue Pleated Maxi",
        ],
        swatchHex: "#274e5e",
        image: "/products/outfits/teal-denim.jpg",
      },
    ];
  }

  return (
    <section id="bundles" className="py-14 md:py-24 border-b border-border/40 bg-muted/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-border/40 gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-primary text-xs uppercase tracking-widest font-semibold">
              <Sparkles className="size-3.5" />
              <span>{isRTL ? "تنسيقات وعروض الباقات الحصرية" : "MIRÉ CURATED BUNDLES"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-brand-serif font-normal text-foreground">
              {isRTL ? "أطقم وتنسيقات البليسيه والمحجبات" : "Coordinated Modest Bundle Sets"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {isRTL
                ? "تنسيقات متكاملة تجمع بين التونيك المنسدل والجيبة البليسيه المكسرة بألوان متناغمة وبسعر توفيري خاص."
                : "Complete curated looks combining fluid tunics and micro-pleated skirts with exclusive package savings."}
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs uppercase tracking-widest font-semibold text-primary hover:underline underline-offset-4 shrink-0"
          >
            {isRTL ? "تسوقي جميع الأطقم ←" : "SHOP ALL SETS →"}
          </Link>
        </div>

        {/* 4 Bundle Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {bundlesData.map((item) => (
            <BundleCard key={item.id} bundle={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
