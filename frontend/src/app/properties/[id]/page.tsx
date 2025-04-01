// src/app/properties/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ImageGallery } from "@/components/Property/ImageGallery";
import { PropertyInfo } from "@/components/Property/PropertyInfo";
import { FeaturesList } from "@/components/Property/FeaturesList";
// Using default import for LocationMap
import LocationMap from "@/components/Property/LocationMap";
import { ContactForm } from "@/components/Property/ContactForm";
import { SimilarProperties } from "@/components/Property/SimilarProperties";
import { FavoriteButton } from "@/components/Property/FavoriteButton";
import { PriceAlert } from "@/components/Property/PriceAlert";
import { Card } from "@/components/Common/Card";
import apiClient from "@/utils/apiClient";
import { PropertyListItem } from "@/utils/propertyClient";

// Define the property image interface
interface PropertyImage {
  id: string;
  url: string;
  alt: string;
}

// Define a raw image type for handling API responses
type RawImageData =
  | string
  | { id?: string; url?: string; alt?: string }
  | unknown;

// Define the price history item interface
interface PriceHistoryItem {
  date: string;
  price: number;
  event: string;
}

// Define the agent interface
interface Agent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

// Define the Feature interface to match FeaturesList component
interface Feature {
  id: string;
  name: string;
  category: string; // Must be required to match the component
  icon?: string;
  description?: string;
  value?: string;
}

// Define a raw feature type for handling API responses
type RawFeatureData =
  | string
  | {
      id?: string;
      name?: string;
      category?: string;
      icon?: string;
      description?: string;
      value?: string;
    }
  | unknown;

// Define the property interface based on the Prisma schema
interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  size?: number;
  rooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  location?: string;
  address?: string;
  status: string;
  featured?: boolean;
  propertyType?: string;
  listingType: string;
  latitude?: number;
  longitude?: number;
  features?: Feature[];
  images: PropertyImage[];
  priceHistory: PriceHistoryItem[];
  agent?: Agent;
  agentId?: string;
  createdAt: string;
}

// Define a type for apiClient response
interface ApiClientResponse {
  success: boolean;
  data: unknown;
  message?: string;
  [key: string]: unknown;
}

// Extended interface for apiClient
interface ApiClient {
  get(url: string): Promise<ApiClientResponse>;
  post(url: string, data?: unknown): Promise<ApiClientResponse>;
  put(url: string, data?: unknown): Promise<ApiClientResponse>;
  delete(url: string): Promise<ApiClientResponse>;
}

// Type assertion for apiClient
const typedApiClient = apiClient as ApiClient;

// Define the favorite property interface
interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  beds?: number;
  baths?: number;
  location?: string;
  imageUrl: string | null;
  status: string;
  listingType: string;
}

// Function to convert API response to PropertyListItem
function convertToPropertyListItem(
  prop: Record<string, unknown>
): PropertyListItem {
  // Extract current timestamp for createdAt if it's missing
  const currentTime = new Date().toISOString();

  return {
    id: String(prop.id || ""),
    title: String(prop.title || ""),
    description: String(prop.description || ""),
    price: Number(prop.price || 0),
    size: Number(prop.area || prop.squareFeet || prop.size || 0),
    rooms: Number(prop.beds || prop.bedrooms || prop.rooms || 0),
    bathrooms: Number(prop.baths || prop.bathrooms || 0),
    location: String(prop.address || prop.location || ""),
    // Convert images to the expected format with createdAt
    images: (() => {
      if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
        return prop.images.map((img: unknown, index: number) => {
          if (typeof img === "string") {
            return {
              id: `img-${index}`,
              url: img,
              propertyId: String(prop.id || ""),
              createdAt: currentTime, // Add required createdAt field
            };
          }
          if (typeof img === "object" && img !== null && img && "url" in img) {
            const imgObj = img as Record<string, unknown>;
            return {
              id: "id" in imgObj ? String(imgObj.id) : `img-${index}`,
              url: String(imgObj.url),
              propertyId: String(prop.id || ""),
              createdAt:
                "createdAt" in imgObj && typeof imgObj.createdAt === "string"
                  ? String(imgObj.createdAt)
                  : currentTime, // Add required createdAt field
            };
          }
          return {
            id: `img-${index}`,
            url: "",
            propertyId: String(prop.id || ""),
            createdAt: currentTime, // Add required createdAt field
          };
        });
      }
      // If no images, return empty array
      return [];
    })(),
    status: String(prop.status || "AVAILABLE") as PropertyListItem["status"],
    featured: Boolean(prop.featured || false),
    propertyType: String(
      prop.propertyType || "HOUSE"
    ) as PropertyListItem["propertyType"],
    listingType: String(
      prop.listingType ||
        (String(prop.status || "")
          .toLowerCase()
          .includes("rent")
          ? "RENT"
          : "SALE")
    ) as PropertyListItem["listingType"],
    agentId: String(prop.agentId || ""),
    // Add optional fields if they exist
    ...(prop.address ? { address: String(prop.address) } : {}),
    ...(prop.beds ? { beds: Number(prop.beds) } : {}),
    ...(prop.baths ? { baths: Number(prop.baths) } : {}),
    ...(prop.area ? { area: Number(prop.area) } : {}),
    ...(prop.imageUrl ? { imageUrl: String(prop.imageUrl) } : {}),
    ...(prop.agent
      ? {
          agent: {
            name: String((prop.agent as Record<string, unknown>)?.name || ""),
          },
        }
      : {}),
  };
}

function PropertyDetailPage() {
  const params = useParams();
  // Make sure params is not null and we don't have a .jpg extension in the ID
  const propertyId = params?.id
    ? (params.id as string).replace(/\.jpg$/, "")
    : "";

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarProperties, setSimilarProperties] = useState<
    PropertyListItem[]
  >([]);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching property details for ID: ${propertyId}`);

        // Direct API call for more control over response handling
        const response = await typedApiClient.get(`/properties/${propertyId}`);

        // Check if we have a successful response with data
        if (response && response.success && response.data) {
          console.log("Successfully loaded property:", response.data);
          // Clone the data and cast to Property to avoid modifying the original
          const result = JSON.parse(JSON.stringify(response.data)) as Property;

          // Format the images if they exist
          if (result.images && Array.isArray(result.images)) {
            // Make sure each image has an id
            result.images = result.images.map(
              (img: RawImageData, index: number) => {
                // If the image is a string, convert it to an object
                if (typeof img === "string") {
                  return {
                    id: `img-${index}`,
                    url: img,
                    alt: `${result.title} image ${index + 1}`,
                  };
                }

                // If the image is an object, make sure it has an id
                if (
                  typeof img === "object" &&
                  img !== null &&
                  img !== undefined
                ) {
                  const imgObj = img as Record<string, unknown>;
                  if ("url" in imgObj) {
                    return {
                      id:
                        "id" in imgObj && typeof imgObj.id === "string"
                          ? imgObj.id
                          : `img-${index}`,
                      url: String(imgObj.url),
                      alt:
                        "alt" in imgObj && typeof imgObj.alt === "string"
                          ? imgObj.alt
                          : `${result.title} image ${index + 1}`,
                    };
                  }
                }

                // Default case for unknown formats
                return {
                  id: `img-${index}`,
                  url:
                    typeof img === "object" && img !== null
                      ? "url" in img && img.url !== undefined
                        ? String(img.url)
                        : ""
                      : String(img || ""),
                  alt: `${result.title} image ${index + 1}`,
                };
              }
            );
          } else {
            // Ensure images is always an array
            result.images = [];
          }

          // Convert string features to Feature objects if needed
          if (result.features && Array.isArray(result.features)) {
            result.features = result.features.map(
              (feature: RawFeatureData, index: number) => {
                if (typeof feature === "string") {
                  return {
                    id: `feature-${index}`,
                    name: feature,
                    category: "general", // Required field
                  };
                }

                // Ensure feature has an id and category
                if (typeof feature === "object" && feature !== null) {
                  const featureObj = feature as Record<string, unknown>;
                  return {
                    id:
                      "id" in featureObj && typeof featureObj.id === "string"
                        ? featureObj.id
                        : `feature-${index}`,
                    name:
                      "name" in featureObj &&
                      typeof featureObj.name === "string"
                        ? featureObj.name
                        : `Feature ${index}`,
                    // Make sure category is always a string as required by component
                    category:
                      "category" in featureObj &&
                      typeof featureObj.category === "string"
                        ? featureObj.category
                        : "general",
                    icon:
                      "icon" in featureObj &&
                      typeof featureObj.icon === "string"
                        ? featureObj.icon
                        : undefined,
                    description:
                      "description" in featureObj &&
                      typeof featureObj.description === "string"
                        ? featureObj.description
                        : undefined,
                    value:
                      "value" in featureObj &&
                      typeof featureObj.value === "string"
                        ? featureObj.value
                        : undefined,
                  };
                }

                return {
                  id: `feature-${index}`,
                  name: String(feature || `Feature ${index}`),
                  category: "general", // Required field
                };
              }
            );
          }

          // If no price history exists, create a minimal one with the current price
          if (!result.priceHistory || !result.priceHistory.length) {
            result.priceHistory = [
              {
                date: result.createdAt || new Date().toISOString(),
                price: result.price,
                event: "Initially listed",
              },
            ];
          }

          setProperty(result);

          // Try to fetch similar properties
          try {
            const similarResponse = await typedApiClient.get(
              `/properties/${propertyId}/similar?limit=3`
            );
            if (
              similarResponse &&
              similarResponse.success &&
              Array.isArray(similarResponse.data)
            ) {
              // Transform API response to PropertyListItem objects
              const formattedProperties = (
                similarResponse.data as Record<string, unknown>[]
              ).map((prop) => convertToPropertyListItem(prop));
              setSimilarProperties(formattedProperties);
            } else {
              console.log("No similar properties available");
              setSimilarProperties([]);
            }
          } catch (err) {
            console.log("Error fetching similar properties:", err);
            setSimilarProperties([]);
          }
        } else {
          console.error(
            "Property not found or invalid response format:",
            response
          );
          setError("Property not found or invalid response format");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        setError("Failed to load property details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error || "Property not found"}</p>
          <div className="mt-4">
            <Link href="/" className="text-primary hover:underline">
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Create a favorite property object from the actual property data
  const favoriteProperty: FavoriteProperty = {
    id: property.id,
    title: property.title,
    price: property.price,
    beds: property.beds || property.rooms,
    baths: property.baths || property.bathrooms,
    location: property.address || property.location,
    imageUrl:
      property.images && property.images.length > 0
        ? property.images[0].url
        : null,
    status: property.status,
    listingType: property.listingType,
  };

  // Debug log for coordinates
  console.log("Property coordinates:", {
    id: property.id,
    title: property.title,
    latitude: property.latitude,
    longitude: property.longitude,
    hasCoordinates: !!(property.latitude && property.longitude),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Image Gallery */}
        <div className="relative">
          <ImageGallery images={property.images || []} />

          {/* Favorite button - positioned in the top right of the gallery */}
          <div className="absolute top-4 right-4 z-10">
            <FavoriteButton
              property={favoriteProperty}
              variant="icon-text"
              className="shadow-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Price Alert Banner (if price recently changed) */}
            {property.priceHistory && property.priceHistory.length > 1 && (
              <div className="mb-6">
                <PriceAlert
                  priceHistory={property.priceHistory}
                  propertyId={property.id}
                />
              </div>
            )}

            {/* Property Information with Integrated Price History */}
            <PropertyInfo property={property} />

            {/* Features List - Only render if features are available */}
            {property.features && property.features.length > 0 && (
              <FeaturesList features={property.features} />
            )}

            {/* Location Map - Always shown, with fallback for missing coordinates */}
            <div className="border rounded-lg p-4 bg-white">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              {property.address ? (
                <LocationMap
                  address={property.address}
                  title={property.title}
                  latitude={property.latitude}
                  longitude={property.longitude}
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-500">
                    Address information not available
                  </p>
                </div>
              )}
            </div>

            {/* Similar Properties - Only render if there are similar properties */}
            {similarProperties.length > 0 && (
              <SimilarProperties
                properties={similarProperties}
                currentPropertyId={property.id}
              />
            )}
          </div>

          <div className="space-y-6">
            {/* Contact Form */}
            <ContactForm
              propertyId={property.id}
              propertyTitle={property.title}
              agentId={property.agentId || property.agent?.id || "unknown"}
            />

            {/* Agent Information Card - Only render if agent info is available */}
            {(property.agent || property.agentId) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Listed By</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 relative">
                    {property.agent?.avatarUrl && (
                      <div className="w-16 h-16 relative">
                        <Image
                          src={property.agent.avatarUrl}
                          alt={property.agent.name || "Agent"}
                          fill
                          className="object-cover rounded-full"
                          sizes="64px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {property.agent?.name || "Contact Agent"}
                    </h3>
                    {property.agent?.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        {property.agent.phone}
                      </p>
                    )}
                    {property.agent?.email && (
                      <p className="text-sm text-gray-500">
                        {property.agent.email}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withSuspense(PropertyDetailPage);
