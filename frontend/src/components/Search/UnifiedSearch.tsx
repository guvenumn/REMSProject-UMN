// Path: src/components/Search/UnifiedSearch.tsx

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "./SearchBar";
import { SearchFilters } from "./SearchFilters";

interface UnifiedSearchProps {
  initialFilters?: Record<string, string>;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  initialFilters = {},
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Get current search parameters from URL
  const getInitialFilters = () => {
    return {
      location: searchParams?.get("location") || initialFilters.location || "",
      propertyType:
        searchParams?.get("propertyType") || initialFilters.propertyType || "",
      listingType:
        searchParams?.get("listingType") || initialFilters.listingType || "",
      minPrice: searchParams?.get("minPrice") || initialFilters.minPrice || "",
      maxPrice: searchParams?.get("maxPrice") || initialFilters.maxPrice || "",
      rooms: searchParams?.get("rooms") || initialFilters.rooms || "",
      bathrooms:
        searchParams?.get("bathrooms") || initialFilters.bathrooms || "",
      status: searchParams?.get("status") || initialFilters.status || "",
      featured: searchParams?.get("featured") || initialFilters.featured || "",
    };
  };

  // Handle search from SearchBar
  const handleSearch = (searchParams: {
    query: string;
    propertyType?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const params = new URLSearchParams();

    if (searchParams.query) {
      params.append("location", searchParams.query);
    }

    if (searchParams.propertyType) {
      params.append("propertyType", searchParams.propertyType);
    }

    if (searchParams.listingType) {
      params.append("listingType", searchParams.listingType);
    }

    if (searchParams.minPrice) {
      params.append("minPrice", searchParams.minPrice);
    }

    if (searchParams.maxPrice) {
      params.append("maxPrice", searchParams.maxPrice);
    }

    router.push(`/properties?${params.toString()}`);
  };

  // Handle filter changes from SearchFilters
  const handleFilterChange = (filters: Record<string, string>) => {
    const params = new URLSearchParams();

    // Add all non-empty filters to the URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    // Navigate to the properties page with the new filters
    router.push(`/properties?${params.toString()}`);
  };

  const currentFilters = getInitialFilters();

  return (
    <div className="space-y-4">
      <SearchBar
        onSearch={handleSearch}
        initialQuery={currentFilters.location}
        initialPropertyType={currentFilters.propertyType}
        initialListingType={currentFilters.listingType}
        initialMinPrice={currentFilters.minPrice}
        initialMaxPrice={currentFilters.maxPrice}
      />

      <div className="flex justify-center mt-2">
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="text-primary text-sm flex items-center"
        >
          {isFilterExpanded ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Hide Advanced Filters
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Show Advanced Filters
            </>
          )}
        </button>
      </div>

      {isFilterExpanded && (
        <SearchFilters onFilterChange={handleFilterChange} />
      )}
    </div>
  );
};

export default UnifiedSearch;
