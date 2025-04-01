// src/components/Home/PropertyCategories.tsx
import React from "react";
import Link from "next/link";
import { Card } from "../Common/Card";

type Category = {
  id: string;
  name: string;
  image: string;
  count: number;
  slug: string;
};

export const PropertyCategories: React.FC = () => {
  // Mock categories
  const categories: Category[] = [
    {
      id: "1",
      name: "Single Family Homes",
      image: "https://via.placeholder.com/300x200",
      count: 1245,
      slug: "single-family",
    },
    {
      id: "2",
      name: "Condos & Apartments",
      image: "https://via.placeholder.com/300x200",
      count: 873,
      slug: "condos",
    },
    {
      id: "3",
      name: "Townhouses",
      image: "https://via.placeholder.com/300x200",
      count: 512,
      slug: "townhouses",
    },
    {
      id: "4",
      name: "Luxury Homes",
      image: "https://via.placeholder.com/300x200",
      count: 328,
      slug: "luxury",
    },
    {
      id: "5",
      name: "Waterfront Properties",
      image: "https://via.placeholder.com/300x200",
      count: 216,
      slug: "waterfront",
    },
    {
      id: "6",
      name: "Land & Lots",
      image: "https://via.placeholder.com/300x200",
      count: 189,
      slug: "land",
    },
  ];

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Browse by Property Type</h2>
          <p className="text-gray-600">
            Explore different types of properties available on our platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/properties?category=${category.slug}`}
              className="block hover:no-underline"
            >
              <Card className="overflow-hidden h-full transition-transform hover:scale-[1.01]">
                <div className="relative h-48">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${category.image})` }}
                  ></div>
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.count} properties
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
