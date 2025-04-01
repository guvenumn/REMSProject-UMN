// src/components/Property/PropertyInfo.tsx
import React from "react";
import { PriceHistory } from "@/components/Property/PriceHistory";
import { formatDate } from "@/utils/dateUtils"; // You may need to create this helper

// Define proper interface for the property
interface PropertyData {
  id: string;
  title: string;
  address?: string;
  location?: string;
  price: number;
  description?: string;
  rooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  size?: number;
  area?: number;
  status?: string;
  propertyType?: string;
  listingType?: string;
  createdAt?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
    reason?: string;
  }>;
}

interface PropertyInfoProps {
  property: PropertyData;
}

export const PropertyInfo: React.FC<PropertyInfoProps> = ({ property }) => {
  // Helper function to format the price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine if the property is for sale or rent based on listingType
  const isForSale = property.listingType === "SALE";
  const isForRent = property.listingType === "RENT";

  // Get the listing type label - fixed to reflect listingType, not status
  const getListingTypeLabel = () => {
    if (isForSale) return "For Sale";
    if (isForRent) return "For Rent";
    return property.listingType || "Listing";
  };

  // Get formatted status text
  const getStatusDisplay = () => {
    if (!property.status) return "Available";

    // Convert status to title case (first letter uppercase, rest lowercase)
    return (
      property.status.charAt(0).toUpperCase() +
      property.status.slice(1).toLowerCase()
    );
  };

  // Get status info for conditional styling
  const getStatusInfo = () => {
    if (
      !property.status ||
      property.status === "AVAILABLE" ||
      property.status.toLowerCase() === "available"
    ) {
      return {
        text: "Available",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    }

    const status = property.status.toUpperCase();

    switch (status) {
      case "SOLD":
        return {
          text: "Sold",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
        };
      case "PENDING":
        return {
          text: "Pending",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
        };
      case "RENTED":
        return {
          text: "Rented",
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
        };
      default:
        return {
          text: getStatusDisplay(),
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
            <p className="text-gray-600 mt-2">
              {property.address || property.location}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {formatPrice(property.price)}
              {isForRent && (
                <span className="text-sm text-gray-500">/month</span>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {/* Listing Type Badge */}
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                {getListingTypeLabel()}
              </span>

              {/* Status Badge - Only show if not "Available" or if we should explicitly show status */}
              {property.status &&
                property.status !== "AVAILABLE" &&
                property.status.toLowerCase() !== "available" && (
                  <span
                    className={`inline-block px-3 py-1 text-sm rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}
                  >
                    {statusInfo.text}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Property details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-t border-b py-6">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Property Type</p>
          <p className="font-semibold">
            {property.propertyType
              ? property.propertyType.charAt(0).toUpperCase() +
                property.propertyType.slice(1).toLowerCase()
              : "House"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Bedrooms</p>
          <p className="font-semibold">
            {property.rooms || property.beds || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Bathrooms</p>
          <p className="font-semibold">
            {property.bathrooms || property.baths || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Size</p>
          <p className="font-semibold">
            {property.size || property.area || 0} ft²
          </p>
        </div>
      </div>

      {/* Price History Section - More prominent and always visible */}
      <div className="mt-6 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span>Price History</span>
          {property.priceHistory && property.priceHistory.length > 1 && (
            <span className="ml-2 text-sm font-normal px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {property.priceHistory.length - 1} price change
              {property.priceHistory.length > 2 ? "s" : ""}
            </span>
          )}
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          {property.priceHistory && property.priceHistory.length > 0 ? (
            <PriceHistory
              priceHistory={property.priceHistory}
              propertyId={property.id}
              limit={5} // Show only the 5 most recent entries
            />
          ) : (
            <p className="text-gray-500 text-center py-4">
              No price history available. This property has maintained its
              original listing price.
            </p>
          )}
        </div>
      </div>

      {/* Property description */}
      {property.description && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {property.description}
          </p>
        </div>
      )}

      {/* Property status and listing date */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Status:</span>{" "}
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${statusInfo.bgColor} ${statusInfo.textColor}`}
          >
            {statusInfo.text}
          </span>
        </div>
        {property.createdAt && (
          <div>
            <span className="font-medium">Listed:</span>{" "}
            {formatDate(property.createdAt)}
          </div>
        )}
        {/* Show last price change if available */}
        {property.priceHistory && property.priceHistory.length > 1 && (
          <div>
            <span className="font-medium">Last Price Change:</span>{" "}
            {formatDate(
              property.priceHistory[property.priceHistory.length - 1].date
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyInfo;
