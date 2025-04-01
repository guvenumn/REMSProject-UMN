// src/components/Property/PriceHistory.tsx
import React from "react";
import Link from "next/link";

interface PriceHistoryItem {
  date: string; // ISO date string
  price: number;
  event?: string; // Optional event description (e.g., "Price reduced", "Initially listed")
}

interface PriceHistoryProps {
  priceHistory: PriceHistoryItem[];
  propertyId?: string;
  limit?: number;
}

export const PriceHistory: React.FC<PriceHistoryProps> = ({
  priceHistory,
  propertyId,
  limit,
}) => {
  // Make sure the price history is sorted by date (oldest first)
  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Apply limit if provided
  const displayHistory = limit ? sortedHistory.slice(-limit) : sortedHistory;

  // Helper function to format the price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Helper function to format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate price difference percentages
  const historyWithChanges = displayHistory.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        changePercentage: 0,
        changeAmount: 0,
        event: item.event || "Initially listed",
      };
    }

    const prevPrice = displayHistory[index - 1].price;
    const currentPrice = item.price;
    const changeAmount = currentPrice - prevPrice;
    const changePercentage = ((changeAmount / prevPrice) * 100).toFixed(1);

    // Determine event if not provided
    const event =
      item.event ||
      (changeAmount < 0
        ? "Price reduced"
        : changeAmount > 0
        ? "Price increased"
        : "Price updated");

    return {
      ...item,
      changePercentage: parseFloat(changePercentage),
      changeAmount,
      event,
    };
  });

  // Function to get the arrow based on price change
  const getPriceChangeArrow = (changePercentage: number) => {
    if (changePercentage > 0) {
      return <span className="text-red-600">↑</span>;
    } else if (changePercentage < 0) {
      return <span className="text-green-600">↓</span>;
    }
    return null;
  };

  // Whether to show the "View Full History" link
  const showViewAllLink = propertyId && limit && priceHistory.length > limit;

  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">Date</th>
            <th className="text-left py-2 px-2">Event</th>
            <th className="text-right py-2 px-2">Price</th>
            <th className="text-right py-2 px-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {historyWithChanges.map((item, index) => (
            <tr
              key={index}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-2">{formatDate(item.date)}</td>
              <td className="py-3 px-2">{item.event}</td>
              <td className="py-3 px-2 text-right font-medium">
                {formatPrice(item.price)}
              </td>
              <td className="py-3 px-2 text-right">
                {index > 0 && (
                  <div
                    className={`font-medium ${
                      item.changePercentage > 0
                        ? "text-red-600"
                        : item.changePercentage < 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {getPriceChangeArrow(item.changePercentage)}
                    {item.changePercentage !== 0 &&
                      `${Math.abs(item.changePercentage)}% `}
                    {item.changeAmount !== 0 &&
                      `(${formatPrice(Math.abs(item.changeAmount))})`}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Full History Link */}
      {showViewAllLink && (
        <div className="mt-4 text-right">
          <Link
            href={`/dashboard/properties/history/${propertyId}`}
            className="text-primary hover:underline text-sm font-medium"
          >
            View Full Price History →
          </Link>
        </div>
      )}
    </div>
  );
};

export default PriceHistory;
