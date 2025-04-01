"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image"; // Import Next.js Image component

import { Button } from "@/components/Common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import {
  getPropertyById,
  // Import the Property and PropertyImage types from propertyClient
  Property as ServerProperty,
  PropertyImage as ServerPropertyImage,
} from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";
import { useAuth } from "@/contexts/AuthContext";
import useRoleAuthorization from "@/hooks/useRoleAuthorization";
import AccessDenied from "@/components/AccessDenied";
import Loading from "@/components/Loading";

// Define PropertyStatus enum to match backend expectations
enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  PENDING = "PENDING",
  SOLD = "SOLD",
  RENTED = "RENTED",
}

// Define PropertyType enum
enum PropertyType {
  HOUSE = "HOUSE",
  TOWNHOUSE = "TOWNHOUSE",
  CONDO = "CONDO",
  APARTMENT = "APARTMENT",
}

// Define ListingType enum
enum ListingType {
  SALE = "SALE",
  RENT = "RENT",
}

// Define the PropertyImage interface for the component
interface PropertyImage {
  id: string;
  url: string;
  propertyId?: string;
  createdAt?: string;
}

// Define the Property interface for the component
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  location: string;
  address: string;
  status: PropertyStatus;
  featured: boolean;
  propertyType: PropertyType;
  listingType: ListingType;
  latitude?: number;
  longitude?: number;
  images: PropertyImage[];
  createdAt?: string;
  updatedAt?: string;
  agentId?: string;
  // We'll keep the agent object for UI purposes, but make it separate from the DB model
  agentInfo?: {
    id: string;
    name: string;
    email: string;
  };
}

// Define a history entry interface
interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default withSuspense(function PropertyHistoryPage() {
  const { isAuthorized, isLoading: authLoading } = useRoleAuthorization([
    "ADMIN",
    "AGENT",
  ]);

  const params = useParams();
  const propertyId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  // Remove unused variable reference or utilize it
  const {
    /* user, */
  } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // Debug propertyId
  useEffect(() => {
    console.log("Property ID from params:", propertyId);
  }, [propertyId]);

  // Fetch property details and history
  useEffect(() => {
    // Only fetch data if user is authorized
    if (!isAuthorized) return;

    const fetchPropertyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!propertyId) {
          throw new Error("Property ID is required");
        }

        console.log("Fetching property with ID:", propertyId);
        const fetchedProperty = await getPropertyById(propertyId);
        console.log("Fetched property data:", fetchedProperty);

        // Check if property data is valid before setting state
        if (!fetchedProperty) {
          throw new Error("Failed to retrieve property data from server");
        }

        // Handle API response that might be wrapped in a data property
        // Fix the 'data' property access
        const serverPropertyData: ServerProperty =
          "data" in fetchedProperty
            ? (fetchedProperty.data as ServerProperty)
            : (fetchedProperty as ServerProperty);

        // Map server property to component property
        const propertyData: Property = {
          id: serverPropertyData.id,
          title: serverPropertyData.title,
          description: serverPropertyData.description,
          price: serverPropertyData.price,
          size: serverPropertyData.size,
          rooms: serverPropertyData.rooms,
          bathrooms: serverPropertyData.bathrooms,
          location: serverPropertyData.location,
          address: serverPropertyData.address,
          status: serverPropertyData.status as PropertyStatus,
          featured: serverPropertyData.featured,
          propertyType: serverPropertyData.propertyType as PropertyType,
          listingType: serverPropertyData.listingType as ListingType,
          latitude: serverPropertyData.latitude,
          longitude: serverPropertyData.longitude,
          images: [],
          createdAt: serverPropertyData.createdAt,
          updatedAt: serverPropertyData.updatedAt,
          agentId: serverPropertyData.agentId,
          // Create agentInfo from the agentId since agent object isn't available in Property type
          agentInfo: {
            id: serverPropertyData.agentId,
            name: "Agent", // Default name when agent details aren't available
            email: "",
          },
        };

        // Process and fix image URLs if needed
        if (
          serverPropertyData.images &&
          Array.isArray(serverPropertyData.images)
        ) {
          propertyData.images = serverPropertyData.images.map(
            (img: ServerPropertyImage) => ({
              id: img.id,
              url: getImageUrl(img.url),
              propertyId: img.propertyId,
              createdAt: img.createdAt,
            })
          );
        }

        setProperty(propertyData);

        // For demo purposes, create some mock history entries
        // In a real implementation, you would fetch this from the API
        const mockHistory: HistoryEntry[] = [
          {
            id: "1",
            action: "CREATED",
            description: "Property listing created",
            timestamp: propertyData.createdAt || new Date().toISOString(),
            user: propertyData.agentInfo,
          },
          {
            id: "2",
            action: "UPDATED",
            description: "Property details updated",
            timestamp: propertyData.updatedAt || new Date().toISOString(),
            user: propertyData.agentInfo,
          },
          {
            id: "3",
            action: "PRICE_CHANGE",
            description: `Price changed to $${propertyData.price}`,
            timestamp: new Date(
              new Date().getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            user: propertyData.agentInfo,
          },
        ];

        setHistoryEntries(mockHistory);
      } catch (err) {
        console.error("Failed to fetch property:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load property details: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    } else {
      setError("No property ID provided");
      setIsLoading(false);
    }
  }, [propertyId, isAuthorized]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusColor = (status: PropertyStatus): string => {
    switch (status) {
      case PropertyStatus.AVAILABLE:
        return "bg-green-100 text-green-800";
      case PropertyStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PropertyStatus.SOLD:
        return "bg-blue-100 text-blue-800";
      case PropertyStatus.RENTED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get action badge color
  const getActionColor = (action: string): string => {
    switch (action) {
      case "CREATED":
        return "bg-green-100 text-green-800";
      case "UPDATED":
        return "bg-blue-100 text-blue-800";
      case "PRICE_CHANGE":
        return "bg-yellow-100 text-yellow-800";
      case "STATUS_CHANGE":
        return "bg-purple-100 text-purple-800";
      case "IMAGE_ADDED":
        return "bg-indigo-100 text-indigo-800";
      case "IMAGE_REMOVED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state while checking authorization
  if (authLoading) {
    return <Loading message="Checking permissions..." />;
  }

  // Show unauthorized message if the user doesn't have permission
  if (!isAuthorized) {
    return (
      <AccessDenied
        title="Property History Access Restricted"
        message="You don't have permission to view property history. This action is restricted to administrators and agents."
      />
    );
  }

  // Show a more descriptive loading state
  if (isLoading && !property) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Loading Property History</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show a more helpful error state
  if (error && !property) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error Loading Property</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
        <p className="mb-4">
          There was a problem loading the property details. This could be due
          to:
        </p>
        <ul className="list-disc ml-6 mb-6">
          <li>The property ID may be invalid</li>
          <li>The property may have been deleted</li>
          <li>There might be a connection issue with the server</li>
        </ul>
        <Button onClick={() => router.push("/dashboard/properties")}>
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Property History</h1>

        <div className="mt-4 md:mt-0 space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/properties/edit/${propertyId}`)
            }
          >
            Edit Property
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/properties")}
          >
            Back to Properties
          </Button>
        </div>
      </div>

      {property && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Property Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Property Image */}
                <div className="aspect-video rounded-md overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0].url}
                      alt={property.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <h2 className="text-xl font-semibold">{property.title}</h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      property.status
                    )}`}
                  >
                    {property.status}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800`}
                  >
                    {property.propertyType}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800`}
                  >
                    {property.listingType}
                  </span>
                </div>

                <div className="text-lg font-bold">
                  ${property.price.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Size:</span> {property.size}{" "}
                    sq ft
                  </div>
                  <div>
                    <span className="text-gray-500">Rooms:</span>{" "}
                    {property.rooms}
                  </div>
                  <div>
                    <span className="text-gray-500">Bathrooms:</span>{" "}
                    {property.bathrooms}
                  </div>
                  <div>
                    <span className="text-gray-500">Featured:</span>{" "}
                    {property.featured ? "Yes" : "No"}
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Location:</span>{" "}
                    {property.location}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Address:</span>{" "}
                    {property.address}
                  </div>
                </div>

                {property.createdAt && (
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(property.createdAt)}
                  </div>
                )}
                {property.updatedAt && (
                  <div className="text-xs text-gray-500">
                    Last Updated: {formatDate(property.updatedAt)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History Timeline Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200"></div>

                {/* Timeline Events */}
                <div className="space-y-6">
                  {historyEntries.length > 0 ? (
                    historyEntries.map((entry) => (
                      <div key={entry.id} className="relative pl-12">
                        {/* Timeline Dot */}
                        <div className="absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white"></div>

                        {/* Timeline Content */}
                        <div className="bg-accent rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                                  entry.action
                                )}`}
                              >
                                {entry.action.replace("_", " ")}
                              </span>
                              {entry.user && (
                                <span className="text-sm text-gray-600">
                                  by {entry.user.name}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                          <p className="text-foreground">{entry.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No history records available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Images Gallery */}
      {property && property.images && property.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {property.images.map((image) => (
                <div key={image.id} className="group relative">
                  <Image
                    src={image.url}
                    alt="Property"
                    width={200}
                    height={150}
                    className="w-full aspect-video object-cover rounded-md"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "/images/properties/property-placeholder.jpeg";
                    }}
                  />
                  {image.createdAt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Added: {new Date(image.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
