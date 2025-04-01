// src/hooks/useFavorites.ts
"use client";

import { useState, useEffect } from "react";

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

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage on initial render
  useEffect(() => {
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
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, loading]);

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

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
};
