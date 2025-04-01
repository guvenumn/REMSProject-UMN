// Path: /src/app/properties/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Common/Button";
import { SearchFilters } from "@/components/Search/SearchFilters";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  getProperties,
  searchPropertiesByLocation,
  PropertyListItem,
} from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";
import { SortOptions, SortOption } from "@/components/Search";

// Import ViewToggle directly - this doesn't use browser APIs directly
import ViewToggle from "@/components/Search/ViewToggle";

// Dynamically import AddressMapView to avoid server-side rendering issues with Leaflet
const AddressMapView = dynamic(
  () => import("@/components/Search/AddressMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

// This component will handle the search params and content
function PropertiesContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams?.get("location") || null;
  const statusParam = searchParams?.get("status") || null;
  const propertyTypeParam = searchParams?.get("propertyType") || null;
  const listingTypeParam = searchParams?.get("listingType") || null;
  const minPriceParam = searchParams?.get("minPrice") || null;
  const maxPriceParam = searchParams?.get("maxPrice") || null;
  const roomsParam = searchParams?.get("rooms") || null;
  const viewParam = searchParams?.get("view") || "grid";

  // State for properties and UI
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<"grid" | "map">(viewParam as "grid" | "map");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyListItem | null>(null);

  // Function to fetch properties that can be called from useEffect
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      // If location parameter exists, use search by location
      if (locationParam && locationParam.trim()) {
        console.log(
          `Searching properties by location: "${locationParam}" with filters:`,
          {
            propertyType: propertyTypeParam,
            listingType: listingTypeParam,
            minPrice: minPriceParam ? parseInt(minPriceParam) : undefined,
            maxPrice: maxPriceParam ? parseInt(maxPriceParam) : undefined,
          }
        );

        result = await searchPropertiesByLocation(
          locationParam,
          currentPage,
          10,
          propertyTypeParam || undefined,
          listingTypeParam || undefined,
          statusParam || undefined,
          minPriceParam ? parseInt(minPriceParam) : undefined,
          maxPriceParam ? parseInt(maxPriceParam) : undefined,
          roomsParam ? parseInt(roomsParam) : undefined
        );

        // More robust error checking - don't rely only on result.success
        if (!result || !Array.isArray(result.properties)) {
          throw new Error(result?.error || "Failed to search properties");
        }
      } else {
        // Otherwise use standard getProperties with filters
        console.log("Fetching properties with filters");

        // Convert price parameters to numbers if they exist
        const minPrice = minPriceParam ? parseInt(minPriceParam) : undefined;
        const maxPrice = maxPriceParam ? parseInt(maxPriceParam) : undefined;

        // Log numeric values for debugging
        if (minPrice !== undefined)
          console.log(`Using minPrice filter: ${minPrice}`);
        if (maxPrice !== undefined)
          console.log(`Using maxPrice filter: ${maxPrice}`);

        const searchFilters = {
          page: currentPage,
          limit: 10,
          status: statusParam || undefined,
          propertyType: propertyTypeParam || undefined,
          listingType: listingTypeParam || undefined,
          minPrice,
          maxPrice,
          rooms: roomsParam ? parseInt(roomsParam) : undefined,
        };

        result = await getProperties(searchFilters);

        // More robust error checking
        if (!result || !Array.isArray(result.properties)) {
          throw new Error(
            "Failed to fetch properties or invalid response format"
          );
        }
      }

      setProperties(result.properties || []);
      setTotalPages(result.pagination?.totalPages || 1);

      // Verify if the filtering is working by checking property prices
      if (minPriceParam) {
        const minPrice = parseInt(minPriceParam);
        const propertiesBelowMin = result.properties.filter(
          (p) => p.price < minPrice
        );
        if (propertiesBelowMin.length > 0) {
          console.warn(
            `Found ${propertiesBelowMin.length} properties with price below the minimum filter (${minPrice})`
          );
        }
      }

      if (maxPriceParam) {
        const maxPrice = parseInt(maxPriceParam);
        const propertiesAboveMax = result.properties.filter(
          (p) => p.price > maxPrice
        );
        if (propertiesAboveMax.length > 0) {
          console.warn(
            `Found ${propertiesAboveMax.length} properties with price above the maximum filter (${maxPrice})`
          );
        }
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    locationParam,
    statusParam,
    propertyTypeParam,
    listingTypeParam,
    minPriceParam,
    maxPriceParam,
    roomsParam,
    currentPage,
  ]);

  // Add sort function
  const sortProperties = (propertiesToSort: PropertyListItem[]) => {
    const sortedProperties = [...propertiesToSort];

    switch (sortOption) {
      case "price_low":
        return sortedProperties.sort(
          (a, b) => Number(a.price) - Number(b.price)
        );
      case "price_high":
        return sortedProperties.sort(
          (a, b) => Number(b.price) - Number(a.price)
        );
      case "newest":
        return sortedProperties.sort((a, b) => {
          // Use createdAt for sorting if available
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return 0;
        });
      case "relevance":
      default:
        return sortedProperties; // Use server's default sorting
    }
  };

  // Sort properties when they change or when sort option changes
  const sortedProperties = useMemo(() => {
    return sortProperties(properties);
  }, [properties, sortOption]);

  // Fetch properties when params change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset to first page when search params change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    locationParam,
    statusParam,
    propertyTypeParam,
    listingTypeParam,
    minPriceParam,
    maxPriceParam,
    roomsParam,
  ]);

  // Update view state when URL parameter changes
  useEffect(() => {
    if (viewParam === "grid" || viewParam === "map") {
      setView(viewParam);
    }
  }, [viewParam]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to get image URL
  const getPropertyImageUrl = (property: PropertyListItem) => {
    let originalUrl = "";

    // If there are images in the property object
    if (property.images && property.images.length > 0) {
      // Check if images is an array of objects with url property
      if (typeof property.images[0] === "object" && property.images[0]?.url) {
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

    // If we have a URL, use the proper imported utility function
    if (originalUrl) {
      return getImageUrl(originalUrl);
    }

    // Default placeholder if no image is found
    return "/images/properties/property-placeholder.jpeg";
  };

  // Helper function to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate page title based on search
  const getPageTitle = () => {
    const parts = [];

    if (listingTypeParam) {
      parts.push(listingTypeParam === "SALE" ? "For Sale" : "For Rent");
    }

    if (propertyTypeParam) {
      parts.push(
        propertyTypeParam.charAt(0) + propertyTypeParam.slice(1).toLowerCase()
      );
    }

    if (statusParam) {
      parts.push(statusParam.charAt(0) + statusParam.slice(1).toLowerCase());
    }

    if (locationParam) {
      parts.push(`in ${locationParam}`);
    }

    if (parts.length > 0) {
      return `Properties ${parts.join(" • ")}`;
    }

    return "All Properties";
  };

  // Handle view toggle
  const handleViewChange = (newView: "grid" | "map") => {
    setView(newView);

    // Update URL with the new view parameter
    const url = new URL(window.location.href);
    url.searchParams.set("view", newView);
    window.history.pushState({}, "", url.toString());
  };

  // Check if any properties have valid addresses
  const hasAddresses = sortedProperties.some(
    (property) =>
      (property.address && property.address.trim().length > 0) ||
      (property.location && property.location.trim().length > 0)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{getPageTitle()}</h1>

      {/* Search Filters */}
      <SearchFilters />

      {/* Debug info for current filters */}
      {(minPriceParam || maxPriceParam) && !loading && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-4 text-xs">
          <p>
            <strong>Active price filters:</strong>
            {minPriceParam &&
              ` Min: $${parseInt(minPriceParam).toLocaleString()}`}
            {maxPriceParam &&
              ` Max: $${parseInt(maxPriceParam).toLocaleString()}`}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold">Error</h3>
          </div>
          <p>{error}</p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => fetchProperties()}
              className="text-sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : sortedProperties.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 className="text-xl font-medium mb-2">No properties found</h2>
          <p className="text-gray-600 mb-4">
            {locationParam
              ? `We couldn't find any properties in "${locationParam}". Try a different location or remove some filters.`
              : "Try adjusting your filters to find more properties."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          {/* Results count and view options */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-gray-600">
              Found {sortedProperties.length} properties
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <SortOptions
                currentSort={sortOption}
                onSortChange={setSortOption}
              />
              <ViewToggle currentView={view} onChange={handleViewChange} />
            </div>
          </div>

          {/* Map view warning if no addresses available */}
          {view === "map" && !hasAddresses && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm">
              <div className="flex items-center text-yellow-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  No properties with valid addresses are available to display on
                  the map. The map may appear empty.
                </span>
              </div>
            </div>
          )}

          {/* Property display - Grid or Map View */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  onMouseEnter={() => setSelectedProperty(property)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Property image */}
                    <div className="md:w-1/4 h-48 md:h-auto relative">
                      <Link
                        href={`/properties/${property.id}`}
                        className="block h-full"
                      >
                        <Image
                          src={getPropertyImageUrl(property)}
                          alt={property.title}
                          className="object-cover"
                          width={300}
                          height={200}
                          style={{ width: "100%", height: "100%" }}
                          unoptimized
                        />
                      </Link>
                    </div>

                    {/* Property details */}
                    <div className="p-4 md:p-6 md:w-2/4 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-2 mb-2">
                          {property.listingType && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {property.listingType === "SALE"
                                ? "For Sale"
                                : "For Rent"}
                            </span>
                          )}
                          {property.propertyType && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">
                              {property.propertyType.charAt(0) +
                                property.propertyType.slice(1).toLowerCase()}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-xl font-semibold hover:text-primary transition mb-2 block"
                        >
                          {property.title}
                        </Link>
                        <p className="text-gray-600 mb-4">
                          {property.address || property.location}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {(property.beds !== undefined ||
                            property.rooms !== undefined) && (
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              {property.beds || property.rooms}{" "}
                              {(property.beds || property.rooms) === 1
                                ? "Bed"
                                : "Beds"}
                            </div>
                          )}
                          {(property.baths !== undefined ||
                            property.bathrooms !== undefined) && (
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2"
                                />
                              </svg>
                              {property.baths || property.bathrooms}{" "}
                              {(property.baths || property.bathrooms) === 1
                                ? "Bath"
                                : "Baths"}
                            </div>
                          )}
                          {(property.area !== undefined ||
                            property.size !== undefined) && (
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                                />
                              </svg>
                              {property.area || property.size} ft²
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="p-4 md:p-6 md:w-1/4 bg-gray-50 flex flex-col justify-between">
                      <div className="text-xl font-bold text-primary mb-4">
                        {formatPrice(property.price)}
                        {property.listingType === "RENT" && (
                          <span className="text-sm font-normal text-gray-500">
                            /month
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Link
                          href={`/properties/${property.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors duration-200"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[600px]">
              <AddressMapView
                properties={sortedProperties}
                selectedProperty={selectedProperty}
              />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Loading fallback for the Suspense boundary
function PropertiesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesLoading />}>
      <PropertiesContent />
    </Suspense>
  );
}
