// file: /frontend/src/components/Home/FeaturedProperties.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PropertyCard } from "../Property/PropertyCard";
import {
  PropertyListItem,
  getFeaturedProperties,
} from "@/utils/propertyClient";

export const FeaturedProperties: React.FC = () => {
  const [featuredProperties, setFeaturedProperties] = useState<
    PropertyListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching featured properties...");

        // Use the proper utility function from propertyClient
        const properties = await getFeaturedProperties(4);

        // Filter out properties that are not available if needed
        // Uncomment the next line if you want to show only available properties
        // const availableProperties = properties.filter(p => p.status === 'AVAILABLE');

        // Or keep all properties regardless of status (shows sold/pending properties too)
        setFeaturedProperties(properties);
      } catch (err) {
        console.error("Failed to fetch featured properties:", err);
        setError("Failed to load featured properties");

        // Set empty array to avoid UI issues
        setFeaturedProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  // Display loading state
  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Properties</h2>
              <p className="text-gray-600">Loading our premium selections...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Display error state, but still show the section framework
  if (error) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Properties</h2>
              <p className="text-gray-600">Explore our premium selections</p>
            </div>
            <Link
              href="/properties"
              className="text-primary hover:underline font-medium"
            >
              View all properties
            </Link>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-8">
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Please try again later or browse all properties.
            </p>
          </div>

          <div className="text-center py-4">
            <Link
              href="/properties"
              className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Browse all properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle case with no featured properties
  if (featuredProperties.length === 0) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Properties</h2>
              <p className="text-gray-600">
                Explore our selection of premium properties
              </p>
            </div>
            <Link
              href="/properties"
              className="text-primary hover:underline font-medium"
            >
              View all properties
            </Link>
          </div>

          <div className="text-center py-10">
            <p className="text-gray-500">
              No featured properties available at the moment.
            </p>
            <Link
              href="/properties"
              className="mt-4 inline-block text-primary hover:underline"
            >
              Browse all properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Display featured properties
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Properties</h2>
            <p className="text-gray-600">
              Explore our selection of premium properties
            </p>
          </div>
          <Link
            href="/properties"
            className="text-primary hover:underline font-medium"
          >
            View all properties
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProperties;
