// Path: src/components/Search/SearchBar.tsx

import React, { useState } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Select } from "../Common/Select";

type SearchBarProps = {
  onSearch: (searchParams: {
    query: string;
    propertyType?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => void;
  initialQuery?: string;
  initialPropertyType?: string;
  initialListingType?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialQuery = "",
  initialPropertyType = "",
  initialListingType = "",
  initialMinPrice = "",
  initialMaxPrice = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [listingType, setListingType] = useState(initialListingType);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [showFilters, setShowFilters] = useState(false);

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

  // Improved currency formatting function
  const formatAsCurrency = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) return "";

    // Parse to number and format with commas
    const number = parseInt(numericValue, 10);

    // Format with thousands separators
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Handle price input change with improved handling
  const handlePriceChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Store the raw numeric value
    const numericValue = value.replace(/\D/g, "");
    setter(numericValue);
  };

  // Handle focus event - select all text for easier editing
  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query,
      propertyType: propertyType || undefined,
      listingType: listingType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-end gap-3">
          {/* Location */}
          <div className="flex-grow">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <Input
              id="location"
              type="text"
              placeholder="City, address, or ZIP code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            />
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <Button
            type="button"
            variant="outline"
            className="md:hidden flex items-center"
            onClick={toggleFilters}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </Button>

          {/* Search Button */}
          <Button type="submit" variant="primary" className="h-10">
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

        {/* Desktop Filters (Always Visible) */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 mt-2">
          {/* Property Type */}
          <div>
            <label
              htmlFor="propertyType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Type
            </label>
            <Select
              id="propertyType"
              name="propertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              options={propertyTypeOptions}
            />
          </div>

          {/* Listing Type */}
          <div>
            <label
              htmlFor="listingType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              For Sale/Rent
            </label>
            <Select
              id="listingType"
              name="listingType"
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              options={listingTypeOptions}
            />
          </div>

          {/* Price Range */}
          <div>
            <label
              htmlFor="priceRange"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price Range
            </label>
            <div className="flex space-x-2">
              <div className="relative w-1/2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  $
                </span>
                <Input
                  id="minPrice"
                  type="text"
                  placeholder="Min"
                  value={formatAsCurrency(minPrice)}
                  onChange={(e) =>
                    handlePriceChange(e.target.value, setMinPrice)
                  }
                  onFocus={handlePriceFocus}
                  className="pl-6"
                  aria-label="Minimum price"
                />
              </div>
              <div className="relative w-1/2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  $
                </span>
                <Input
                  id="maxPrice"
                  type="text"
                  placeholder="Max"
                  value={formatAsCurrency(maxPrice)}
                  onChange={(e) =>
                    handlePriceChange(e.target.value, setMaxPrice)
                  }
                  onFocus={handlePriceFocus}
                  className="pl-6"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters (Expandable) */}
        {showFilters && (
          <div className="md:hidden space-y-3 pt-3 border-t border-gray-200 mt-3">
            {/* Property Type */}
            <div>
              <label
                htmlFor="propertyTypeMobile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Property Type
              </label>
              <Select
                id="propertyTypeMobile"
                name="propertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                options={propertyTypeOptions}
              />
            </div>

            {/* Listing Type */}
            <div>
              <label
                htmlFor="listingTypeMobile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                For Sale/Rent
              </label>
              <Select
                id="listingTypeMobile"
                name="listingType"
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                options={listingTypeOptions}
              />
            </div>

            {/* Price Range */}
            <div>
              <label
                htmlFor="priceRangeMobile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price Range
              </label>
              <div className="flex space-x-2">
                <div className="relative w-1/2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    $
                  </span>
                  <Input
                    id="minPriceMobile"
                    type="text"
                    placeholder="Min"
                    value={formatAsCurrency(minPrice)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMinPrice)
                    }
                    onFocus={handlePriceFocus}
                    className="pl-6"
                    aria-label="Minimum price (mobile)"
                  />
                </div>
                <div className="relative w-1/2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    $
                  </span>
                  <Input
                    id="maxPriceMobile"
                    type="text"
                    placeholder="Max"
                    value={formatAsCurrency(maxPrice)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMaxPrice)
                    }
                    onFocus={handlePriceFocus}
                    className="pl-6"
                    aria-label="Maximum price (mobile)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
