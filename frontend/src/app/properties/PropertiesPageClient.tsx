// Path: /frontend/src/app/properties/PropertiesPageClient.tsx

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { withSuspense } from "@/utils/withSuspense";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
// Import icons from lucide-react. Make sure the package is installed and/or declared.
import { MapIcon, LayoutGridIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { environment } from "@/config/environment";
// Import from utils
import {
  getProperties,
  searchPropertiesByLocation,
  PropertyListItem,
} from "@/utils/propertyClient";
import { Button } from "@/components/Common/Button";
import Image from "next/image";

// Type for view mode
type ViewMode = "grid" | "map";

// Dynamically import MapView to avoid server-side rendering issues with Leaflet
const MapView = dynamic(() => import("@/components/Search/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
  ),
});

// --- View Toggle Component ---
const ViewToggle = ({
  currentView,
  onChange,
}: {
  currentView: ViewMode;
  onChange: (view: ViewMode) => void;
}) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => onChange("grid")}
      className={`flex items-center px-3 py-2 rounded-md ${
        currentView === "grid"
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600 hover:text-gray-800"
      }`}
    >
      <LayoutGridIcon className="w-5 h-5 mr-2" />
      <span>Grid</span>
    </button>
    <button
      onClick={() => onChange("map")}
      className={`flex items-center px-3 py-2 rounded-md ${
        currentView === "map"
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600 hover:text-gray-800"
      }`}
    >
      <MapIcon className="w-5 h-5 mr-2" />
      <span>Map</span>
    </button>
  </div>
);

// Type for advanced search parameters
interface AdvancedSearchParams {
  location?: string;
  status?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  rooms?: string;
}

// --- Advanced Search Component ---
const AdvancedSearch = ({
  initialParams = {},
  onSearch,
}: {
  initialParams?: AdvancedSearchParams;
  onSearch: (params: AdvancedSearchParams) => void;
}) => {
  const [location, setLocation] = useState(initialParams.location || "");
  const [status, setStatus] = useState(initialParams.status || "");
  const [propertyType, setPropertyType] = useState(
    initialParams.propertyType || ""
  );
  const [listingType, setListingType] = useState(
    initialParams.listingType || ""
  );
  const [minPrice, setMinPrice] = useState(initialParams.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice || "");
  const [rooms, setRooms] = useState(initialParams.rooms || "");

  // Format input as currency without $ sign
  const formatAsCurrency = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) return "";

    // Convert to number and format with commas
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericValue));
  };

  // Handle price input change
  const handlePriceChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Store the raw numeric value but display formatted
    const numericValue = value.replace(/\D/g, "");
    setter(numericValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: AdvancedSearchParams = {};
    if (location.trim()) params.location = location.trim();
    if (status) params.status = status;
    if (propertyType) params.propertyType = propertyType;
    if (listingType) params.listingType = listingType;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (rooms) params.rooms = rooms;
    onSearch(params);
  };

  const handleReset = () => {
    setLocation("");
    setStatus("");
    setPropertyType("");
    setListingType("");
    setMinPrice("");
    setMaxPrice("");
    setRooms("");
    onSearch({});
  };

  return (
    <div className="mb-8 bg-white p-5 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Advanced Search</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Address, ZIP..."
              className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            >
              <option value="">All Types</option>
              <option value="HOUSE">House</option>
              <option value="TOWNHOUSE">Townhouse</option>
              <option value="CONDO">Condo</option>
              <option value="APARTMENT">Apartment</option>
            </select>
          </div>

          {/* Listing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              For Sale/Rent
            </label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            >
              <option value="">All Listings</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                $
              </span>
              <input
                type="text"
                value={formatAsCurrency(minPrice)}
                onChange={(e) => handlePriceChange(e.target.value, setMinPrice)}
                placeholder="Min Price"
                className="pl-6 w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                $
              </span>
              <input
                type="text"
                value={formatAsCurrency(maxPrice)}
                onChange={(e) => handlePriceChange(e.target.value, setMaxPrice)}
                placeholder="Max Price"
                className="pl-6 w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms
            </label>
            <select
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" variant="primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search
          </Button>
        </div>
      </form>
    </div>
  );
};

// Helper function to get image URL from property
const getImageUrl = (property: PropertyListItem): string => {
  let originalUrl = "";
  if (property.images && property.images.length > 0) {
    if (
      typeof property.images[0] === "object" &&
      property.images[0] !== null &&
      "url" in property.images[0]
    ) {
      originalUrl = property.images[0].url;
    } else if (typeof property.images[0] === "string") {
      originalUrl = property.images[0];
    }
  }

  if (originalUrl) {
    return `${environment.apiBaseUrl}${
      originalUrl.startsWith("/") ? "" : "/"
    }${originalUrl}`;
  }
  return "/images/properties/property-placeholder.jpeg";
};

// --- Main Component ---
function PropertiesPageClient() {
  const router = useRouter();
  // Provide a default if useSearchParams returns null
  const searchParams = useSearchParams() || new URLSearchParams();

  // Extract search parameters safely
  const locationParam = searchParams.get("location") || "";
  const statusParam = searchParams.get("status") || "";
  const propertyTypeParam = searchParams.get("propertyType") || "";
  const listingTypeParam = searchParams.get("listingType") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const roomsParam = searchParams.get("rooms") || "";
  const viewParam = (searchParams.get("view") as ViewMode) || "grid";

  // State for properties and UI
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyListItem | null>(null);

  // Fetch properties function
  // Modified fetchProperties function to properly handle minPrice/maxPrice filters
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (locationParam.trim()) {
        result = await searchPropertiesByLocation(
          locationParam,
          currentPage,
          10,
          propertyTypeParam || undefined,
          listingTypeParam || undefined,
          statusParam || undefined,
          minPriceParam ? parseFloat(minPriceParam) : undefined,
          maxPriceParam ? parseFloat(maxPriceParam) : undefined,
          roomsParam ? parseInt(roomsParam, 10) : undefined
        );
        if (!result.properties) {
          throw new Error(result.error || "Failed to search properties");
        }

        // Update the result properties and pagination
        setProperties(result.properties || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        const searchFilters = {
          page: currentPage,
          limit: 10,
          status: statusParam || undefined,
          propertyType: propertyTypeParam || undefined,
          listingType: listingTypeParam || undefined,
          minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
          maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
          rooms: roomsParam ? parseInt(roomsParam, 10) : undefined,
        };
        result = await getProperties(searchFilters);

        // Update the result properties and pagination
        setProperties(result.properties || []);
        setTotalPages(result.pagination?.totalPages || 1);
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

  // Sort function for properties
  const sortProperties = useCallback(
    (data: PropertyListItem[], sortBy: string) => {
      const sortedData = [...data];

      switch (sortBy) {
        case "price_low":
          return sortedData.sort((a, b) => Number(a.price) - Number(b.price));
        case "price_high":
          return sortedData.sort((a, b) => Number(b.price) - Number(a.price));
        case "newest":
          return sortedData.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }
            return 0;
          });
        default:
          return sortedData;
      }
    },
    []
  );

  // Sort properties based on the current sort option
  const [sortOption, setSortOption] = useState("newest");
  const sortedProperties = useMemo(
    () => sortProperties(properties, sortOption),
    [properties, sortOption, sortProperties]
  );

  // Fetch properties on param changes
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

  // Update viewMode when URL parameter changes
  useEffect(() => {
    if (viewParam === "grid" || viewParam === "map") {
      setViewMode(viewParam);
    }
  }, [viewParam]);

  const handleAdvancedSearch = (params: AdvancedSearchParams) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.append(key, value);
      }
    });
    urlParams.append("view", viewMode);
    router.push(`/properties?${urlParams.toString()}`);
  };

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    const urlParams = new URLSearchParams(searchParams.toString());
    urlParams.set("view", view);
    router.push(`/properties?${urlParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (sortBy: string) => {
    setSortOption(sortBy);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  const getPageTitle = (): string => {
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
    return parts.length > 0
      ? `Properties ${parts.join(" • ")}`
      : "All Properties";
  };

  const hasCoordinates = (property: PropertyListItem): boolean =>
    property.latitude !== undefined &&
    property.longitude !== undefined &&
    property.latitude !== null &&
    property.longitude !== null;

  const getPropertiesWithCoordinates = (): PropertyListItem[] =>
    sortedProperties.filter(hasCoordinates);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        {!loading && sortedProperties.length > 0 && (
          <ViewToggle currentView={viewMode} onChange={handleViewChange} />
        )}
      </div>

      <AdvancedSearch
        initialParams={{
          location: locationParam,
          status: statusParam,
          propertyType: propertyTypeParam,
          listingType: listingTypeParam,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          rooms: roomsParam,
        }}
        onSearch={handleAdvancedSearch}
      />

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
              onClick={fetchProperties}
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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div className="text-gray-600 mb-2 sm:mb-0">
              Found {sortedProperties.length} properties
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-select"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="py-1 px-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="price_low">Price (Low to High)</option>
                  <option value="price_high">Price (High to Low)</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
            </div>
          </div>

          {viewMode === "map" && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="h-[calc(100vh-400px)] min-h-[600px]">
                {getPropertiesWithCoordinates().length > 0 ? (
                  <MapView
                    properties={getPropertiesWithCoordinates()}
                    selectedProperty={selectedProperty}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center p-8">
                      <MapIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">
                        No mappable properties
                      </h3>
                      <p>
                        None of the current properties have location coordinates
                        for mapping.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 gap-6">
              {sortedProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                  onMouseEnter={() => setSelectedProperty(property)}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 h-48 md:h-auto relative">
                      <Link
                        href={`/properties/${property.id}`}
                        className="block h-full"
                      >
                        <Image
                          src={getImageUrl(property)}
                          alt={property.title}
                          className="object-cover"
                          width={300}
                          height={200}
                          style={{ width: "100%", height: "100%" }}
                          unoptimized
                        />
                      </Link>
                    </div>
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
          )}
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

export default withSuspense(PropertiesPageClient);
