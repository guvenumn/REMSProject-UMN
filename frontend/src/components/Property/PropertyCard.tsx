// Path: src/components/Property/PropertyCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/Property/FavoriteButton";
import { PropertyListItem } from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";

interface PropertyCardProps {
  property: PropertyListItem;
  showFavoriteButton?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showFavoriteButton = true,
}) => {
  // Helper function to format the price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Helper function to get the image URL from the property
  const getPropertyImageUrl = () => {
    let originalUrl = "";

    // If there are images in the property object
    if (property.images && property.images.length > 0) {
      // Check if images is an array of objects with url property
      if (
        typeof property.images[0] === "object" &&
        "url" in property.images[0] &&
        property.images[0].url
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
      return getImageUrl(originalUrl);
    }

    // Default placeholder if no image is found
    return "/images/properties/property-placeholder.jpeg";
  };

  // Get the image URL for this property
  const imageUrl = getPropertyImageUrl();

  // Determine if the property is for sale or rent based on listingType only
  const isForSale = property.listingType === "SALE";
  const isForRent = property.listingType === "RENT";

  // Get status for display
  const getPropertyStatus = () => {
    // If status is explicitly set
    if (property.status) {
      switch (property.status) {
        case "SOLD":
          return "Sold";
        case "PENDING":
          return "Pending";
        case "RENTED":
          return "Rented";
        case "AVAILABLE":
          return isForSale ? "For Sale" : isForRent ? "For Rent" : "Available";
        default:
          return property.status;
      }
    }
    // Default based on listing type
    return isForSale ? "For Sale" : isForRent ? "For Rent" : "Listing";
  };

  // Get badge style and text based on property status
  const getStatusInfo = () => {
    // If status is not available, show the listing type
    if (!property.status || property.status === "AVAILABLE") {
      if (isForSale) {
        return {
          color: "bg-blue-600",
          text: "For Sale",
          position: "left", // Show on left side
        };
      } else if (isForRent) {
        return {
          color: "bg-green-600",
          text: "For Rent",
          position: "left", // Show on left side
        };
      } else {
        return {
          color: "bg-amber-600",
          text: "Available",
          position: "left", // Show on left side
        };
      }
    }
    // If status is not "AVAILABLE", show the status badge
    else {
      switch (property.status) {
        case "SOLD":
          return {
            color: "bg-blue-600",
            text: "Sold",
            position: "left", // Show on left side
          };
        case "PENDING":
          return {
            color: "bg-yellow-600",
            text: "Pending",
            position: "left", // Show on left side
          };
        case "RENTED":
          return {
            color: "bg-purple-600",
            text: "Rented",
            position: "left", // Show on left side
          };
        default:
          return {
            color: "bg-gray-600",
            text: property.status,
            position: "left", // Show on left side
          };
      }
    }
  };

  const statusInfo = getStatusInfo();
  const displayStatus = getPropertyStatus();

  // Check if property has price history with changes
  const hasPriceChanges =
    property.priceHistory !== undefined && property.priceHistory.length > 1;

  // Check if the most recent price change was a reduction
  const hasRecentPriceReduction =
    hasPriceChanges &&
    property.priceHistory &&
    property.priceHistory.length > 1 &&
    property.priceHistory[property.priceHistory.length - 1].price <
      property.priceHistory[property.priceHistory.length - 2].price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px]">
      <Link
        href={`/properties/${property.id}`}
        className="block relative h-48 overflow-hidden"
      >
        {/* Property Image */}
        <img
          src={imageUrl}
          alt={property.title || "Property image"}
          className="object-cover w-full h-full"
          crossOrigin="anonymous"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = "/images/properties/property-placeholder.jpeg";
          }}
        />

        {/* Status Badge - Now only one badge is shown based on status */}
        <div
          className={`absolute top-2 ${
            statusInfo.position === "left" ? "left-2" : "right-2"
          } px-2 py-1 rounded text-xs font-bold uppercase text-white ${
            statusInfo.color
          }`}
        >
          {statusInfo.text}
        </div>

        {/* Price Reduction Badge */}
        {hasRecentPriceReduction && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
            Price Reduced
          </div>
        )}
      </Link>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold mb-1 line-clamp-1">
            <Link
              href={`/properties/${property.id}`}
              className="text-gray-800 hover:text-primary"
            >
              {property.title}
            </Link>
          </h3>
          {showFavoriteButton && <FavoriteButton property={property} />}
        </div>
        <div className="flex items-center mb-2">
          <p className="text-primary font-bold text-xl">
            {formatPrice(property.price)}
            {isForRent && (
              <span className="text-sm font-normal text-gray-500">/month</span>
            )}
          </p>

          {/* Price History Indicator */}
          {hasPriceChanges && property.priceHistory && (
            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded-full">
              {property.priceHistory.length - 1} price change
              {property.priceHistory.length > 2 ? "s" : ""}
            </span>
          )}

          {/* Status Tag - Updated to show property status instead of just listing type */}
          <span
            className={`ml-auto px-2 py-0.5 
            ${
              property.status === "SOLD"
                ? "bg-blue-100 text-blue-800"
                : property.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : property.status === "RENTED"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-700"
            }
            text-xs rounded-full`}
          >
            {displayStatus}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          {property.address || property.location}
        </p>
        <div className="flex items-center text-sm text-gray-500 justify-between">
          {(property.beds !== undefined || property.rooms !== undefined) && (
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
              {(property.beds || property.rooms) === 1 ? "Bed" : "Beds"}
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
              {(property.baths || property.bathrooms) === 1 ? "Bath" : "Baths"}
            </div>
          )}
          {(property.area !== undefined || property.size !== undefined) && (
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
  );
};

export default PropertyCard;
