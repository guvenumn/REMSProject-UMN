// File: /var/www/rems/frontend/src/contexts/FavoritesContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

export type FavoriteProperty = {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  location: string;
  imageUrl?: string;
  status?: "sale" | "rent";
};

type FavoritesContextType = {
  favorites: FavoriteProperty[];
  loading: boolean;
  addFavorite: (property: FavoriteProperty) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (property: any) => boolean; // Changed to accept any property type
  clearFavorites: () => void; // Added function to clear favorites
};

const defaultContextValue: FavoritesContextType = {
  favorites: [],
  loading: false,
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  toggleFavorite: () => false,
  clearFavorites: () => {}, // Added default implementation
};

const FavoritesContext =
  createContext<FavoritesContextType>(defaultContextValue);

export const useFavoritesContext = () => {
  return useContext(FavoritesContext);
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load favorites from localStorage on initial render (client-side only)
  useEffect(() => {
    if (!mounted) return;

    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem("favorites");
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [mounted]);

  // Save favorites to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (!mounted || loading) return;

    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [favorites, loading, mounted]);

  // Convert any property object to FavoriteProperty type with proper field mapping
  const convertToFavoriteProperty = (property: any): FavoriteProperty => {
    return {
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
          ? (property.status.toLowerCase() as "sale" | "rent")
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
  };

  // Add a property to favorites
  const addFavorite = (property: FavoriteProperty) => {
    setFavorites((prevFavorites) => {
      // Check if already in favorites
      if (prevFavorites.some((fav) => fav.id === property.id)) {
        return prevFavorites;
      }
      return [...prevFavorites, property];
    });
  };

  // Remove a property from favorites
  const removeFavorite = (propertyId: string) => {
    setFavorites((prevFavorites) =>
      prevFavorites.filter((property) => property.id !== propertyId)
    );
  };

  // Check if a property is in favorites
  const isFavorite = (propertyId: string) => {
    return favorites.some((property) => property.id === propertyId);
  };

  // Clear all favorites
  const clearFavorites = () => {
    setFavorites([]);
    if (mounted) {
      localStorage.removeItem("favorites");
    }
  };

  // Toggle a property in favorites - now accepts any property type
  const toggleFavorite = (property: any) => {
    // First convert the property to ensure proper field mapping
    const favoriteProperty = convertToFavoriteProperty(property);

    if (isFavorite(favoriteProperty.id)) {
      removeFavorite(favoriteProperty.id);
      return false; // Removed from favorites
    } else {
      addFavorite(favoriteProperty);
      return true; // Added to favorites
    }
  };

  const contextValue = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};
