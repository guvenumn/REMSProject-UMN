// File: /var/www/rems/frontend/src/components/Property/FavoriteButton.tsx
"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useFavoritesContext } from "@/contexts/FavoritesContext";

type FavoriteButtonProps = {
  property: any; // Changed to accept any property type for more flexibility
  variant?: "icon-only" | "icon-text";
  className?: string;
};

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  property,
  variant = "icon-only",
  className = "",
}) => {
  // Use try-catch to prevent breaking the component if context is not available
  let contextValue;
  try {
    contextValue = useFavoritesContext();
  } catch (error) {
    console.error("FavoritesContext not available:", error);
    // Return a non-functional button when context is not available
    return variant === "icon-only" ? (
      <button
        className={`p-2 bg-white/80 rounded-full shadow-sm text-gray-400 ${className}`}
        disabled
      >
        <HeartIcon filled={false} />
      </button>
    ) : (
      <button
        className={`flex items-center gap-1 px-3 py-2 bg-white/80 rounded-full shadow-sm text-gray-400 ${className}`}
        disabled
      >
        <HeartIcon filled={false} />
        <span>Save</span>
      </button>
    );
  }

  const { isFavorite, toggleFavorite } = contextValue;
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize the property object to match the FavoriteProperty type
  const normalizedProperty = {
    id: property.id,
    title: property.title,
    // Handle price - convert to number if it's a string
    price:
      typeof property.price === "string"
        ? parseFloat(property.price)
        : property.price,
    // Map beds field - check for different possible property names
    beds:
      property.beds !== undefined
        ? property.beds
        : property.bedrooms !== undefined
        ? property.bedrooms
        : property.rooms !== undefined
        ? property.rooms
        : 0,
    // Map baths field - check for different possible property names
    baths:
      property.baths !== undefined
        ? property.baths
        : property.bathrooms !== undefined
        ? property.bathrooms
        : 0,
    // Use location or address
    location: property.location || property.address || "",
    // Handle image URL
    imageUrl:
      property.imageUrl ||
      (property.images && property.images.length > 0
        ? typeof property.images[0] === "object" && property.images[0].url
          ? property.images[0].url
          : property.images[0]
        : undefined),
    // Normalize status (convert to lowercase if needed)
    status: property.status
      ? property.status.toLowerCase &&
        (property.status.toLowerCase() === "sale" ||
          property.status.toLowerCase() === "rent")
        ? property.status.toLowerCase()
        : property.listingType === "SALE"
        ? "sale"
        : property.listingType === "RENT"
        ? "rent"
        : undefined
      : property.listingType === "SALE"
      ? "sale"
      : property.listingType === "RENT"
      ? "rent"
      : undefined,
  };

  const isFavorited = isFavorite(property.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent link/button from being triggered
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);

    // Log the original and normalized property for debugging
    console.log("Original property:", property);
    console.log("Normalized for favorite:", normalizedProperty);

    const wasAdded = toggleFavorite(normalizedProperty);

    // Show a toast notification
    if (wasAdded) {
      toast.success("Added to favorites");
    } else {
      toast.success("Removed from favorites");
    }

    setIsProcessing(false);
  };

  return variant === "icon-only" ? (
    <button
      onClick={handleToggleFavorite}
      className={`p-2 bg-white/80 rounded-full shadow-sm ${
        isFavorited
          ? "text-red-500 hover:text-red-600"
          : "text-gray-500 hover:text-gray-700"
      } ${className}`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <HeartIcon filled={isFavorited} />
    </button>
  ) : (
    <button
      onClick={handleToggleFavorite}
      className={`flex items-center gap-1 px-3 py-2 bg-white/80 rounded-full shadow-sm ${
        isFavorited
          ? "text-red-500 hover:text-red-600"
          : "text-gray-500 hover:text-gray-700"
      } ${className}`}
    >
      <HeartIcon filled={isFavorited} />
      <span>{isFavorited ? "Saved" : "Save"}</span>
    </button>
  );
};

// Heart icon component
const HeartIcon = ({ filled }: { filled: boolean }) => {
  return filled ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
};
