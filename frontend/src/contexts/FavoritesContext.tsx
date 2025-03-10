// src/contexts/FavoritesContext.tsx
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
  toggleFavorite: (property: FavoriteProperty) => boolean;
};

const defaultContextValue: FavoritesContextType = {
  favorites: [],
  loading: false,
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  toggleFavorite: () => false,
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

  // Toggle a property in favorites
  const toggleFavorite = (property: FavoriteProperty) => {
    if (isFavorite(property.id)) {
      removeFavorite(property.id);
      return false; // Removed from favorites
    } else {
      addFavorite(property);
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
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};
