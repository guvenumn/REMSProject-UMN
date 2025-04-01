// Path: /frontend/src/components/Search/SearchFilters.tsx
"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter, useSearchParams } from "next/navigation";
// Removed unused Card import
import { Button } from "@/components/Common/Button";

interface SearchFiltersProps {
  onFilterChange?: (filters: Record<string, string>) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFilterChange,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);

  const [filters, setFilters] = useState({
    listingType: searchParams?.get("listingType") || "",
    location: searchParams?.get("location") || "",
    minPrice: searchParams?.get("minPrice") || "",
    maxPrice: searchParams?.get("maxPrice") || "",
    rooms: searchParams?.get("rooms") || "",
    bathrooms: searchParams?.get("bathrooms") || "",
    status: searchParams?.get("status") || "",
    propertyType: searchParams?.get("propertyType") || "",
    featured: searchParams?.get("featured") || "",
  });

  useEffect(() => {
    if (onFilterChange) {
      const nonEmptyFilters = Object.fromEntries(
        // Fixed unused variable warning by removing the underscore
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      onFilterChange(nonEmptyFilters);
    }
  }, [filters, onFilterChange]);

  // Format currency for display
  const formatAsCurrency = (value: string) => {
    if (!value) return "";

    // Parse to number and format with commas
    const number = parseInt(value, 10);
    if (isNaN(number)) return "";

    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle price input change specifically
  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "minPrice" | "maxPrice"
  ) => {
    // Strip non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, "");
    setFilters((prev) => ({ ...prev, [field]: numericValue }));
  };

  // Handle focus event for price inputs
  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: checked ? "true" : "" }));
  };

  const handleApplyFilters = () => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);
  };

  const handleResetFilters = () => {
    setFilters({
      listingType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      rooms: "",
      bathrooms: "",
      status: "",
      propertyType: "",
      featured: "",
    });
    router.push("/properties");
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Find Your Perfect Property</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium flex items-center hover:underline"
          >
            {isExpanded ? "Simple Search" : "Advanced Search"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ml-1 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 pb-6">
        <form>
          {/* Basic search (always visible) */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={filters.location}
                  onChange={handleInputChange}
                  placeholder="City, Address, ZIP..."
                  className="pl-10 pr-3 py-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            <div className="md:w-48">
              <select
                id="listingType"
                name="listingType"
                value={filters.listingType}
                onChange={handleInputChange}
                className="w-full py-3 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              >
                <option value="">All Listings</option>
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
              </select>
            </div>

            {!isExpanded && (
              <Button
                type="button"
                variant="primary"
                className="md:w-40 flex items-center justify-center"
                onClick={handleApplyFilters}
              >
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
            )}
          </div>

          {/* Advanced search options (expandable) */}
          {isExpanded && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="propertyType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleInputChange}
                    className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  >
                    <option value="">All Types</option>
                    <option value="HOUSE">House</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="CONDO">Condo</option>
                    <option value="APARTMENT">Apartment</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleInputChange}
                    className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="PENDING">Pending</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rooms"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bedrooms
                  </label>
                  <select
                    id="rooms"
                    name="rooms"
                    value={filters.rooms}
                    onChange={handleInputChange}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="minPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Min Price
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      $
                    </span>
                    <input
                      id="minPrice"
                      name="minPrice"
                      type="text"
                      value={formatAsCurrency(filters.minPrice)}
                      onChange={(e) => handlePriceChange(e, "minPrice")}
                      onFocus={handlePriceFocus}
                      placeholder="Min Price"
                      className="py-2 pl-6 pr-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                      aria-label="Minimum price"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="maxPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Max Price
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      $
                    </span>
                    <input
                      id="maxPrice"
                      name="maxPrice"
                      type="text"
                      value={formatAsCurrency(filters.maxPrice)}
                      onChange={(e) => handlePriceChange(e, "maxPrice")}
                      onFocus={handlePriceFocus}
                      placeholder="Max Price"
                      className="py-2 pl-6 pr-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={filters.featured === "true"}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                  />
                  <label htmlFor="featured" className="text-sm">
                    Featured Properties Only
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="order-1 sm:order-2 flex items-center"
                  onClick={handleApplyFilters}
                >
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
                  Apply Filter
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default withSuspense(SearchFilters);
