// Path: /frontend/src/components/Home/QuickSearch.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../Common/Card";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Select } from "../Common/Select";
import { useTheme } from "@/contexts/ThemeContext";

export const QuickSearch: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const propertyTypeOptions = [
    { label: "All Property Types", value: "" },
    { label: "House", value: "HOUSE" },
    { label: "Townhouse", value: "TOWNHOUSE" },
    { label: "Condo", value: "CONDO" },
    { label: "Apartment", value: "APARTMENT" },
  ];

  const listingTypeOptions = [
    { label: "All Listings", value: "" },
    { label: "For Sale", value: "SALE" },
    { label: "For Rent", value: "RENT" },
  ];

  // Format input as currency without $ sign
  const formatAsCurrency = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) return "";

    // Convert to number and format with commas
    const formatted = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericValue));

    return formatted;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (location.trim()) {
        params.append("location", location.trim());
      }

      if (propertyType) {
        params.append("propertyType", propertyType);
      }

      if (listingType) {
        params.append("listingType", listingType);
      }

      if (minPrice) {
        params.append("minPrice", minPrice);
      }

      if (maxPrice) {
        params.append("maxPrice", maxPrice);
      }

      // Add view mode parameter (default to grid)
      params.append("view", "grid");

      // Navigate to properties page with the search parameters
      router.push(`/properties?${params.toString()}`);
    } catch (error) {
      console.error("Search error:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get card background color based on theme
  const getCardBgColor = () => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50';
      case 'gray':
        return 'bg-gray-800';
      case 'dark':
        return 'bg-gray-900';
      default:
        return 'bg-white';
    }
  };

  // Get text color based on theme
  const getTextColor = () => {
    return theme === 'white' ? 'text-primary' : 'text-white';
  };

  return (
    <Card className={`p-6 shadow-lg mx-auto -mt-12 relative z-10 max-w-5xl ${getCardBgColor()}`}>
      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        {/* Basic Search Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <Input
              label="Find your dream home"
              placeholder="Enter address, city, or ZIP code"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (error) setError(null);
              }}
              className="w-full"
              icon={
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
              }
              error={error || undefined}
            />
          </div>

          <div>
            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="min-w-[120px] h-[42px] md:self-end"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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
        </div>

        {/* Advanced Search Toggle */}
        <div>
          <button
            type="button"
            className={`${getTextColor()} text-sm font-medium flex items-center`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <>
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
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Hide Advanced Options
              </>
            ) : (
              <>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Show Advanced Options
              </>
            )}
          </button>
        </div>

        {/* Advanced Search Options */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className={`block text-sm font-medium ${theme !== 'white' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Property Type
              </label>
              <Select
                name="propertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                options={propertyTypeOptions}
              />
            </div>

            {/* Listing Type */}
            <div>
              <label className={`block text-sm font-medium ${theme !== 'white' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                For Sale/Rent
              </label>
              <Select
                name="listingType"
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                options={listingTypeOptions}
              />
            </div>

            {/* Price Range */}
            <div>
              <label className={`block text-sm font-medium ${theme !== 'white' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Price Range
              </label>
              <div className="flex space-x-2">
                <div className="relative w-1/2">
                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${theme !== 'white' ? 'text-gray-400' : 'text-gray-500'}`}>
                    $
                  </span>
                  <Input
                    type="text"
                    placeholder="Min"
                    value={formatAsCurrency(minPrice)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMinPrice)
                    }
                    className="pl-6"
                  />
                </div>
                <div className="relative w-1/2">
                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${theme !== 'white' ? 'text-gray-400' : 'text-gray-500'}`}>
                    $
                  </span>
                  <Input
                    type="text"
                    placeholder="Max"
                    value={formatAsCurrency(maxPrice)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMaxPrice)
                    }
                    className="pl-6"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default QuickSearch;