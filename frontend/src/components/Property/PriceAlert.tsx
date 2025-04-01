// src/components/Property/PriceAlert.tsx
import React from "react";
import Link from "next/link";

interface PriceHistoryItem {
  date: string; // ISO date string
  price: number;
  previousPrice?: number;
  event?: string; // Optional event description
}

interface PriceAlertProps {
  priceHistory?: PriceHistoryItem[];
  propertyId: string;
  compact?: boolean;
}

/**
 * Component to display price change alerts and notices
 */
export const PriceAlert: React.FC<PriceAlertProps> = ({
  priceHistory,
  propertyId,
  compact = false,
}) => {
  // Safeguard against missing price history
  if (!priceHistory || priceHistory.length <= 1) return null;

  // Sort price history by date (newest first)
  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mostRecent = sortedHistory[0];
  const previousEntry = sortedHistory[1];

  // If we don't have prices to compare, don't show anything
  if (!mostRecent?.price || !previousEntry?.price) return null;

  // Calculate days since price change
  const daysSinceChange = Math.floor(
    (new Date().getTime() - new Date(mostRecent.date).getTime()) /
      (1000 * 3600 * 24)
  );

  // Only show for recent changes (within last 30 days)
  if (daysSinceChange > 30) return null;

  // Calculate price difference
  const priceDiff = mostRecent.price - previousEntry.price;
  const percentDiff = ((priceDiff / previousEntry.price) * 100).toFixed(1);
  const isReduction = priceDiff < 0;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (compact) {
    // Compact version for property cards
    return (
      <Link
        href={`/properties/${propertyId}?highlight=price-history`}
        className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
          isReduction
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isReduction ? "Price Reduced" : "Price Increased"}{" "}
        {Math.abs(parseFloat(percentDiff))}%
      </Link>
    );
  }

  // Full version for property detail page
  return (
    <div
      className={`mb-4 p-3 rounded-lg border ${
        isReduction
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              isReduction ? "text-green-800" : "text-red-800"
            }`}
          >
            {isReduction ? "Price Reduced" : "Price Increased"} on{" "}
            {formatDate(mostRecent.date)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {daysSinceChange === 0
              ? "Today"
              : daysSinceChange === 1
              ? "Yesterday"
              : `${daysSinceChange} days ago`}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-lg font-bold ${
              isReduction ? "text-green-800" : "text-red-800"
            }`}
          >
            {isReduction ? "" : "+"}
            {percentDiff}%
          </p>
          <p className="text-sm font-medium">{formatPrice(priceDiff)}</p>
        </div>
      </div>
      <div className="mt-2">
        <Link
          href={`/properties/${propertyId}?section=price-history`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View Price History →
        </Link>
      </div>
    </div>
  );
};

export default PriceAlert;
