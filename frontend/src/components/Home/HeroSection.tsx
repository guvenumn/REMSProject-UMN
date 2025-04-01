// src/components/Home/HeroSection.tsx
"use client";

import React from "react";
import { Button } from "../Common/Button";
import Link from "next/link";

export const HeroSection: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero background - using a div with bg color instead of image for now */}
      <div
        className="absolute inset-0 bg-gray-800"
        // You can still keep this style for when you have a real image
        style={{
          backgroundImage: "url(https://via.placeholder.com/1920x1080)",
          filter: "brightness(0.7)",
        }}
      ></div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-24 sm:py-32 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6">
          Find Your Dream Home
        </h1>
        <p className="text-xl text-white text-center mb-8 max-w-2xl">
          Discover thousands of properties for sale and rent across the country.
          Start your search today and find the perfect place to call home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/properties?listingType=SALE">
            <Button size="lg">Buy a Home</Button>
          </Link>
          <Link href="/properties?listingType=RENT">
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white hover:bg-white/20"
            >
              Rent a Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
