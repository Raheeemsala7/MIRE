import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HeroSection } from "@/features/home/components/hero-section";
import { CategoryGrid } from "@/features/home/components/category-grid";
import { OutfitsGallery } from "@/features/home/components/outfits-gallery";
import { NewArrivals } from "@/features/home/components/new-arrivals";
import { BrandStory } from "@/features/home/components/brand-story";
import { ValuePillars } from "@/features/home/components/value-pillars";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function HomeContent({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full flex flex-col">
      <HeroSection />
      <CategoryGrid />
      <OutfitsGallery />
      <NewArrivals />
      <BrandStory />
      <ValuePillars />
    </div>
  );
}

export default function HomePage({ params }: HomePageProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent params={params} />
    </Suspense>
  );
}
