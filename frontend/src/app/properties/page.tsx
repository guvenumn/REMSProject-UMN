// /frontend/ser/app/properties/page.tsx

"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { PropertyCard } from "@/components/Property/PropertyCard";

// Sample property data
const sampleProperties = [
  {
    id: "1",
    title: "Modern Apartment in Downtown",
    price: 599000,
    beds: 3,
    baths: 2,
    location: "123 Main St, Cityville",
    sqft: 1450,
  },
  {
    id: "2",
    title: "Luxury Family Home",
    price: 725000,
    beds: 4,
    baths: 3,
    location: "456 Oak Ave, Townsville",
    sqft: 2200,
  },
  {
    id: "3",
    title: "Spacious Condo with View",
    price: 849000,
    beds: 5,
    baths: 3,
    location: "789 Pine St, Villagetown",
    sqft: 2800,
  },
];

export default function PropertiesPage() {
  return (
    <Layout variant="default">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Featured Properties</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
