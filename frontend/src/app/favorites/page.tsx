// File: /frontend/src/app/favorites/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { Card } from "@/components/Common/Card";
import { Button } from "@/components/Common/Button";
import { getImageUrl } from "@/utils/uploadClient";

// Define a more comprehensive PropertyType to handle all possible fields
interface PropertyType {
  id: string;
  title: string;
  price: number | string;
  location: string;
  status?: string;
  images?: Array<string | { url: string }>;
  imageUrl?: string;
  beds: number;
  baths: number;
  // Additional fields that might be present but we don't use directly
  bedrooms?: number;
  rooms?: number;
  bedroom?: number;
  room?: number;
  bathrooms?: number;
  bathroom?: number;
  details?: {
    beds?: number;
    bedrooms?: number;
    baths?: number;
    bathrooms?: number;
  };
}

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const { favorites, removeFavorite, loading } = useFavoritesContext();

  // Log the favorites data to help diagnose property structure
  React.useEffect(() => {
    if (favorites.length > 0) {
      console.log("Favorites data structure:", favorites[0]);
      console.log(
        "Full favorites object:",
        JSON.stringify(favorites[0], null, 2)
      );

      // Check all possible field names for beds/baths
      const firstProperty = favorites[0] as PropertyType;
      console.log("Bed-related fields:", {
        beds: firstProperty.beds,
        bedrooms: firstProperty.bedrooms,
        rooms: firstProperty.rooms,
        bedroom: firstProperty.bedroom,
        room: firstProperty.room,
      });

      console.log("Bath-related fields:", {
        baths: firstProperty.baths,
        bathrooms: firstProperty.bathrooms,
        bathroom: firstProperty.bathroom,
      });
    }
  }, [favorites]);

  // Helper function to get proper image URL, similar to PropertyCard
  const getPropertyImageUrl = (property: PropertyType): string => {
    let originalUrl = "";

    // If there are images in the property object
    if (property.images && property.images.length > 0) {
      // Check if images is an array of objects with url property
      if (
        typeof property.images[0] === "object" &&
        "url" in property.images[0]
      ) {
        originalUrl = property.images[0].url;
      }
      // If images is an array of strings
      else if (typeof property.images[0] === "string") {
        originalUrl = property.images[0];
      }
    }
    // If there's an imageUrl directly on the property
    else if (property.imageUrl) {
      originalUrl = property.imageUrl;
    }

    // If we have a URL, use the helper function
    if (originalUrl) {
      try {
        return getImageUrl(originalUrl);
      } catch (error) {
        console.error("Error processing image URL:", error);
      }
    }

    // Default placeholder if no image is found
    return "/images/properties/property-placeholder.jpeg";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4 border border-t-0 rounded-b-lg">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Require authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view and manage your favorite properties.
          </p>
          <Link href="/login?callbackUrl=/favorites" passHref>
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((property) => {
            const typedProperty = property as PropertyType;

            // Get the processed image URL
            const imageUrl = getPropertyImageUrl(typedProperty);

            // Use the beds and baths from the property
            const beds = typedProperty.beds || 0;
            const baths = typedProperty.baths || 0;

            return (
              <Card key={typedProperty.id} className="overflow-hidden">
                <div className="h-40 bg-gray-200 relative">
                  {/* Using next/image instead of img element */}
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={typedProperty.title}
                      fill
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "/images/properties/property-placeholder.jpeg";
                        target.onerror = null; // Prevent infinite loop if placeholder also fails
                      }}
                    />
                  </div>
                  {typedProperty.status && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-1 text-xs font-semibold rounded-md bg-primary text-white">
                        For {typedProperty.status === "sale" ? "Sale" : "Rent"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-primary text-lg font-semibold mb-2">
                    $
                    {typeof typedProperty.price === "string"
                      ? parseInt(typedProperty.price).toLocaleString()
                      : typedProperty.price.toLocaleString()}
                    {typedProperty.status === "rent" && (
                      <span className="text-sm text-gray-500">/month</span>
                    )}
                  </div>
                  <h3 className="font-medium">{typedProperty.title}</h3>
                  <p className="text-sm text-gray-700">
                    {beds} beds • {baths} baths
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {typedProperty.location}
                  </p>
                  <div className="mt-4 flex justify-between">
                    <Link href={`/properties/${typedProperty.id}`} passHref>
                      <Button variant="outline" size="sm">
                        View Property
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                      onClick={() => removeFavorite(typedProperty.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">No Saved Properties</h2>
          <p className="text-gray-600 mb-6">
            You haven&apos;t saved any properties to your favorites yet.
          </p>
          <Link href="/properties" passHref>
            <Button>Browse Properties</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
