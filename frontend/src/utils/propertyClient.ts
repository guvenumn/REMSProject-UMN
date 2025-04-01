// Path: /frontend/src/utils/propertyClient.ts
import { api } from "./apiClient"; // Using named import for consistency

// Property types
export type PropertyStatus = "AVAILABLE" | "PENDING" | "SOLD" | "RENTED";
export type PropertyType = "HOUSE" | "TOWNHOUSE" | "CONDO" | "APARTMENT";
export type ListingType = "SALE" | "RENT";

export interface PropertyImage {
  id: string;
  url: string;
  propertyId: string;
  caption?: string;
  isPrimary?: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  location: string;
  address: string;
  images: PropertyImage[];
  status: PropertyStatus;
  featured: boolean;
  propertyType: PropertyType;
  listingType: ListingType;
  latitude?: number;
  longitude?: number;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

// Define proper type for price history entries
export interface PriceHistoryEntry {
  price: number;
  date: string;
}

export interface PropertyListItem {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  location: string;
  images: PropertyImage[];
  status: PropertyStatus;
  featured: boolean;
  propertyType: PropertyType;
  listingType: ListingType;
  agentId: string;

  // Additional fields used in components
  address?: string;
  imageUrl?: string;
  beds?: number;
  baths?: number;
  area?: number;
  priceHistory?: PriceHistoryEntry[];
  agent?: { name: string };
  createdAt?: string;

  // Map-related fields
  latitude?: number;
  longitude?: number;
}

export interface PropertyFilters {
  location?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  rooms?: number;
  bathrooms?: number;
  propertyType?: string;
  listingType?: string;
  status?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

// Define a proper type for API responses
export interface PropertyApiResponse {
  success?: boolean;
  message?: string;
  data?: Property | Property[] | null;
  property?: Property;
  properties?: Property[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  id?: string;
  title?: string;
  [key: string]: unknown;
}

// Define the type for getProperties response
export interface GetPropertiesResponse {
  success?: boolean;
  error?: string;
  properties: PropertyListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Extract property data from API response
 */
function extractPropertyData(response: PropertyApiResponse): Property | null {
  console.log("Extracting property data from:", response);

  if (!response) {
    console.error("No response received");
    return null;
  }

  // Response has a data property (standard API response format)
  if (response.data && !Array.isArray(response.data)) {
    return response.data;
  }

  // Response is the property object directly
  if (response.id && response.title) {
    return response as unknown as Property;
  }

  // Response has a property property
  if (response.property && response.property.id) {
    return response.property;
  }

  console.error("Could not extract property data from response:", response);
  return null;
}

/**
 * Get all properties with optional filtering
 */
export async function getProperties(
  filters: PropertyFilters = {}
): Promise<GetPropertiesResponse> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `properties${queryString ? `?${queryString}` : ""}`;

    console.log(
      `[propertyClient] Getting properties with endpoint: ${endpoint}`
    );

    const response = (await api.get(endpoint)) as PropertyApiResponse;

    console.log("[propertyClient] Properties response:", response);

    // Handle different response formats
    let properties: PropertyListItem[] = [];
    let pagination = {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
    };

    if (response?.data && Array.isArray(response.data)) {
      properties = response.data;
    } else if (response?.properties && Array.isArray(response.properties)) {
      properties = response.properties;
    } else if (Array.isArray(response)) {
      properties = response as unknown as PropertyListItem[];
    }

    if (response?.pagination) {
      pagination = {
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.total,
        itemsPerPage: response.pagination.limit,
      };
    }

    return {
      success: true,
      properties,
      pagination,
    };
  } catch (error) {
    console.error("[propertyClient] Error fetching properties:", error);
    return {
      success: false,
      error: "Failed to fetch properties",
      properties: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
}

/**
 * Search properties by location
 */
/**
 * Search properties by location with improved coordinate handling
 */
export async function searchPropertiesByLocation(
  location: string,
  page: number = 1,
  limit: number = 10,
  propertyType?: string,
  listingType?: string,
  status?: string,
  minPrice?: number,
  maxPrice?: number,
  rooms?: number,
  bathrooms?: number,
  featured?: boolean
): Promise<GetPropertiesResponse> {
  try {
    // Build query parameters explicitly including all filters
    const params = new URLSearchParams({
      location,
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add optional parameters
    if (propertyType) params.append("propertyType", propertyType);
    if (listingType) params.append("listingType", listingType);
    if (status) params.append("status", status);
    if (minPrice !== undefined) params.append("minPrice", minPrice.toString());
    if (maxPrice !== undefined) params.append("maxPrice", maxPrice.toString());
    if (rooms !== undefined) params.append("rooms", rooms.toString());
    if (bathrooms !== undefined)
      params.append("bathrooms", bathrooms.toString());
    if (featured !== undefined) params.append("featured", featured.toString());

    console.log(
      `Searching properties with location "${location}" and filters:`,
      {
        propertyType,
        listingType,
        status,
        minPrice,
        maxPrice,
        rooms,
        bathrooms,
        featured,
      }
    );

    const response = await api.get(`/properties/search?${params.toString()}`);

    // Ensure we have a valid response
    if (!response || !response.data) {
      throw new Error("Invalid response from server");
    }

    const result = response.data;

    // Process properties to ensure coordinates are correctly handled
    const processProperties = (
      properties: PropertyListItem[]
    ): PropertyListItem[] => {
      return properties.map((property) => {
        // Create a new property object with processed coordinates
        const processedProperty = { ...property };

        // Convert latitude and longitude to numbers if they exist and are strings
        if (
          processedProperty.latitude !== undefined &&
          processedProperty.latitude !== null
        ) {
          const latValue =
            typeof processedProperty.latitude === "string"
              ? parseFloat(processedProperty.latitude)
              : processedProperty.latitude;

          // Only assign if it's a valid number
          if (!isNaN(latValue)) {
            processedProperty.latitude = latValue;
          } else {
            // Set to undefined if it's not a valid number
            processedProperty.latitude = undefined;
          }
        }

        if (
          processedProperty.longitude !== undefined &&
          processedProperty.longitude !== null
        ) {
          const lngValue =
            typeof processedProperty.longitude === "string"
              ? parseFloat(processedProperty.longitude)
              : processedProperty.longitude;

          // Only assign if it's a valid number
          if (!isNaN(lngValue)) {
            processedProperty.longitude = lngValue;
          } else {
            // Set to undefined if it's not a valid number
            processedProperty.longitude = undefined;
          }
        }

        return processedProperty;
      });
    };

    // Handle the case where the API directly returns an array of properties
    if (Array.isArray(result)) {
      console.log("API returned an array of properties directly");

      // Process properties to ensure coordinates are correctly handled
      const processedProperties = processProperties(result);

      // Log the first property coordinates for debugging
      if (processedProperties.length > 0) {
        console.log("First property coordinates:", {
          id: processedProperties[0].id,
          latitude: processedProperties[0].latitude,
          longitude: processedProperties[0].longitude,
          latType: typeof processedProperties[0].latitude,
          lonType: typeof processedProperties[0].longitude,
        });
      }

      // Apply client-side price filtering
      let filteredProperties = [...processedProperties];

      if (minPrice !== undefined) {
        filteredProperties = filteredProperties.filter(
          (p) => p.price >= minPrice
        );
      }

      if (maxPrice !== undefined) {
        filteredProperties = filteredProperties.filter(
          (p) => p.price <= maxPrice
        );
      }

      return {
        success: true,
        properties: filteredProperties,
        pagination: {
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filteredProperties.length / limit)),
          totalItems: filteredProperties.length,
          itemsPerPage: limit,
        },
      };
    }

    // Check if the response has the expected structure with properties array
    if (!result || !result.properties || !Array.isArray(result.properties)) {
      console.error("Unexpected response format:", result);
      return {
        success: false,
        error: "Invalid response format from the server",
        properties: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }

    // Process properties to ensure coordinates are correctly handled
    const processedProperties = processProperties(result.properties);

    // Log the first property coordinates for debugging if available
    if (processedProperties.length > 0) {
      console.log("First property coordinates:", {
        id: processedProperties[0].id,
        latitude: processedProperties[0].latitude,
        longitude: processedProperties[0].longitude,
        latType: typeof processedProperties[0].latitude,
        lonType: typeof processedProperties[0].longitude,
      });
    }

    // Apply client-side price filtering to ensure filters are applied properly
    let filteredProperties = [...processedProperties];

    if (minPrice !== undefined) {
      filteredProperties = filteredProperties.filter(
        (p) => p.price >= minPrice
      );
    }

    if (maxPrice !== undefined) {
      filteredProperties = filteredProperties.filter(
        (p) => p.price <= maxPrice
      );
    }

    // Return properly formatted response
    return {
      success: true,
      properties: filteredProperties,
      pagination: result.pagination || {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(filteredProperties.length / limit)),
        totalItems: filteredProperties.length,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    console.error("Error searching properties by location:", error);
    return {
      success: false,
      error: "Failed to search properties by location",
      properties: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
      },
    };
  }
}

/**
 * Get a property by ID
 */
export async function getPropertyById(id: string): Promise<Property> {
  try {
    console.log(`[propertyClient] Getting property with ID: ${id}`);
    const response = (await api.get(`properties/${id}`)) as PropertyApiResponse;
    console.log(`[propertyClient] Property ${id} response:`, response);

    // Handle different API response formats
    const propertyData = extractPropertyData(response);

    if (!propertyData) {
      throw new Error(`Failed to extract property data for ID: ${id}`);
    }

    return propertyData;
  } catch (error) {
    console.error(`[propertyClient] Error fetching property ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new property
 */
export async function createProperty(
  propertyData: Partial<Property>
): Promise<Property> {
  try {
    // Clean up any undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(propertyData).filter(([, v]) => v !== undefined)
    );

    console.log("[propertyClient] Creating property with data:", cleanedData);

    // Use 'properties' endpoint without /api prefix
    // apiClient.ts will handle the path properly
    const response = (await api.post(
      "properties",
      cleanedData
    )) as PropertyApiResponse;

    // Log the response for debugging
    console.log("[propertyClient] Create property response:", response);

    // Check for error response format
    if (response?.success === false) {
      throw new Error(response.message || "Failed to create property");
    }

    // Handle different response formats
    const result = response?.data || response;
    return result as Property;
  } catch (error) {
    console.error("[propertyClient] Error creating property:", error);

    // Enhanced error reporting
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create property";
    const statusCode = (error as Record<string, unknown>)?.status || "unknown";
    console.error(
      `[propertyClient] Error details: ${errorMessage} (${statusCode})`
    );

    throw error;
  }
}

/**
 * Update an existing property
 */
export async function updateProperty(
  id: string,
  propertyData: Partial<Property>
): Promise<Property> {
  try {
    console.log(
      `[propertyClient] Updating property ${id} with data:`,
      propertyData
    );

    // Ensure we're sending valid data by removing undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(propertyData).filter(([, v]) => v !== undefined)
    );

    // Log the cleaned data being sent to the API
    console.log(`[propertyClient] Sending cleaned data:`, cleanedData);

    const response = (await api.put(
      `properties/${id}`,
      cleanedData
    )) as PropertyApiResponse;
    console.log(`[propertyClient] Update property ${id} response:`, response);

    // Better response checking
    if (response === null || response === undefined) {
      throw new Error("Received empty response from server");
    }

    if (response.success === false) {
      throw new Error(response.message || "Failed to update property");
    }

    // Handle different response formats
    const result = response?.data || response;
    return result as Property;
  } catch (error) {
    // Improved error logging with more details
    console.error(`[propertyClient] Error updating property ${id}:`, error);

    if (typeof error === "object" && error !== null && "response" in error) {
      const errorResponse = (
        error as { response?: { data?: unknown; status?: number } }
      ).response;
      if (errorResponse) {
        console.error(`[propertyClient] Response data:`, errorResponse.data);
        console.error(
          `[propertyClient] Response status:`,
          errorResponse.status
        );
      }
    }

    // Add a more descriptive error message if the error object is empty
    if (typeof error === "object" && error !== null) {
      if (!("message" in error) && Object.keys(error).length === 0) {
        (error as Record<string, string>).message =
          "Network error or server timeout";
      }
    }

    throw error;
  }
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    await api.delete(`properties/${id}`);
    return true;
  } catch (error) {
    console.error(`[propertyClient] Error deleting property ${id}:`, error);
    return false;
  }
}

/**
 * Upload property images
 */
export async function uploadPropertyImages(
  propertyId: string,
  formData: FormData
): Promise<PropertyImage[] | unknown> {
  try {
    const response = (await api.postFormData(
      `properties/${propertyId}/images`,
      formData
    )) as PropertyApiResponse;

    return response?.data || response;
  } catch (error) {
    console.error(
      `[propertyClient] Error uploading images for property ${propertyId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a property image
 */
export async function deletePropertyImage(
  propertyId: string,
  imageId: string
): Promise<boolean> {
  try {
    await api.delete(`properties/${propertyId}/images/${imageId}`);
    return true;
  } catch (error) {
    console.error(
      `[propertyClient] Error deleting image ${imageId} for property ${propertyId}:`,
      error
    );
    return false;
  }
}

/**
 * Toggle featured status
 */
export async function toggleFeaturedProperty(
  id: string,
  featured: boolean
): Promise<Property> {
  try {
    const response = (await api.put(`properties/${id}/featured`, {
      featured,
    })) as PropertyApiResponse;

    return (response?.data || response) as Property;
  } catch (error) {
    console.error(
      `[propertyClient] Error toggling featured status for property ${id}:`,
      error
    );
    throw error;
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatus(
  id: string,
  status: PropertyStatus
): Promise<Property> {
  try {
    const response = (await api.put(`properties/${id}/status`, {
      status,
    })) as PropertyApiResponse;

    return (response?.data || response) as Property;
  } catch (error) {
    console.error(
      `[propertyClient] Error updating status for property ${id}:`,
      error
    );
    throw error;
  }
}

/**
 * Get featured properties
 */
export async function getFeaturedProperties(
  limit = 6
): Promise<PropertyListItem[]> {
  try {
    const response = (await api.get(
      `properties?featured=true&limit=${limit}`
    )) as PropertyApiResponse;

    // Handle different response formats
    let properties: PropertyListItem[] = [];
    if (response?.data && Array.isArray(response.data)) {
      properties = response.data;
    } else if (response?.properties && Array.isArray(response.properties)) {
      properties = response.properties;
    } else if (Array.isArray(response)) {
      properties = response as unknown as PropertyListItem[];
    }

    return properties;
  } catch (error) {
    console.error(
      "[propertyClient] Error fetching featured properties:",
      error
    );
    return [];
  }
}

// Create a named export for the property client
export const propertyClient = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  toggleFeaturedProperty,
  updatePropertyStatus,
  getFeaturedProperties,
  searchPropertiesByLocation,
};

// Export for legacy compatibility (default export)
export default propertyClient;
