import React from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import { HeroSection } from "@/src/features/home/components/hero-section";
import { CategoryGrid } from "@/src/features/home/components/category-grid";
import { BrandStory } from "@/src/features/home/components/brand-story";
import { NewArrivals } from "@/src/features/home/components/new-arrivals";
import { OutfitsGallery } from "@/src/features/home/components/outfits-gallery";
import { ValuePillars } from "@/src/features/home/components/value-pillars";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full flex flex-col">
      <HeroSection />
      <CategoryGrid />
      <OutfitsGallery />
      <BrandStory />
      <NewArrivals />
      <ValuePillars />
    </div>
  );
}
