// Path: /frontend/src/hooks/useProperties.ts
import { useState, useEffect, useCallback } from "react";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  toggleFeaturedProperty, // Corrected from toggleFavoriteProperty
  getFeaturedProperties, // Corrected from getFavoriteProperties
  PropertyListItem,
  PropertyFilters, // Corrected from PropertySearchFilters
  Property,
} from "../utils/propertyClient"; // Import all types from propertyClient instead of ../types

// PropertyFormData is used in the original hook but not defined in propertyClient
// Defining it here based on the Property type with partial fields
type PropertyFormData = Partial<Property>;

/**
 * Custom hook for managing properties data and operations
 */
export function useProperties(initialFilters?: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters || {});
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  // Fetch properties with current filters
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProperties(filters);
      setProperties(result.properties);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch properties"
      );
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters and refetch properties
  const updateFilters = useCallback((newFilters: Partial<PropertyFilters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
      page: 1, // Reset to page 1 when filters change
    }));
  }, []);

  // Reset filters to initial state
  const resetFilters = useCallback(() => {
    setFilters(initialFilters || {});
  }, [initialFilters]);

  // Handle pagination change
  const changePage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Fetch a single property by ID
  const fetchProperty = useCallback(
    async (id: string): Promise<Property | null> => {
      try {
        return await getPropertyById(id);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch property"
        );
        return null;
      }
    },
    []
  );

  // Create a new property
  const addProperty = useCallback(
    async (propertyData: PropertyFormData): Promise<Property | null> => {
      setLoading(true);
      setError(null);
      try {
        const newProperty = await createProperty(propertyData);
        // Update the local state if needed
        fetchProperties(); // Refetch the list to include the new property
        return newProperty;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create property"
        );
        console.error("Error creating property:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchProperties]
  );

  // Update an existing property
  const updatePropertyData = useCallback(
    async (
      id: string,
      data: Partial<PropertyFormData>
    ): Promise<Property | null> => {
      setLoading(true);
      setError(null);
      try {
        const updatedProperty = await updateProperty(id, data);
        // Update the local state with the updated property
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updatedProperty } : p))
        );
        return updatedProperty;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update property"
        );
        console.error("Error updating property:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete a property
  const removeProperty = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete property"
      );
      console.error("Error deleting property:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch featured properties
  const loadFeaturedProperties = useCallback(
    async (limit: number = 6): Promise<PropertyListItem[]> => {
      try {
        return await getFeaturedProperties(limit);
      } catch (err) {
        console.error("Error fetching featured properties:", err);
        return [];
      }
    },
    []
  );

  // Toggle featured status for a property
  const toggleFeatured = useCallback(
    async (propertyId: string, featured: boolean): Promise<boolean> => {
      try {
        await toggleFeaturedProperty(propertyId, featured);

        // Update the properties list to reflect the change
        setProperties((prev) =>
          prev.map((property) =>
            property.id === propertyId ? { ...property, featured } : property
          )
        );

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update featured status"
        );
        console.error("Error toggling featured status:", err);
        return false;
      }
    },
    []
  );

  // Load properties on mount and when filters change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    changePage,
    fetchProperty,
    addProperty,
    updateProperty: updatePropertyData,
    removeProperty,
    loadFeaturedProperties,
    toggleFeatured,
    refetch: fetchProperties,
  };
}

/**
 * Custom hook for managing a single property
 */
export function useProperty(propertyId?: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setProperty(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyById(propertyId);
      setProperty(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch property details"
      );
      console.error("Error fetching property:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // Update existing property
  const updatePropertyData = useCallback(
    async (data: Partial<PropertyFormData>): Promise<Property | null> => {
      if (!propertyId || !property) return null;

      setLoading(true);
      setError(null);
      try {
        const updatedProperty = await updateProperty(propertyId, data);
        setProperty(updatedProperty);
        return updatedProperty;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update property"
        );
        console.error("Error updating property:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [propertyId, property]
  );

  // Toggle featured status
  const toggleFeatured = useCallback(
    async (featured: boolean): Promise<boolean> => {
      if (!propertyId) return false;

      try {
        await toggleFeaturedProperty(propertyId, featured);
        if (property) {
          setProperty({ ...property, featured });
        }
        return true;
      } catch (err) {
        console.error("Error toggling featured status:", err);
        return false;
      }
    },
    [propertyId, property]
  );

  // Load property data
  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    loading,
    error,
    updateProperty: updatePropertyData,
    toggleFeatured,
    refetch: fetchProperty,
  };
}

export default useProperties;
