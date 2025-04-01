// src/app/page.tsx
import React from "react";
import { HeroSection } from "@/components/Home/HeroSection";
import { QuickSearch } from "@/components/Home/QuickSearch";
import { FeaturedProperties } from "@/components/Home/FeaturedProperties";
// import { PropertyCategories } from "@/components/Home/PropertyCategories";
// import { PriceFeatures } from "@/components/Home/PriceFeatures";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <div className="container mx-auto px-4">
        <QuickSearch />
      </div>
      <FeaturedProperties />
      {/* <PropertyCategories /> */}
      {/* <PriceFeatures /> */}
    </main>
  );
}
