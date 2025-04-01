// /frontend/src/utils/searchClient.ts
import { api } from "./apiClient";
import { User } from "./userClient";
import { PropertyListItem } from "./propertyClient";

/**
 * Interface for search results returned from the API
 */
export interface SearchResults {
  users?: User[];
  properties?: PropertyListItem[];
  total?: number;
}

/**
 * Interface for API response structure
 */
interface ApiResponse {
  data: SearchResults;
  status: number;
  statusText: string;
}

/**
 * Interface for search parameters
 */
export interface SearchParams {
  query: string;
  type?: "users" | "properties" | "all";
  limit?: number;
  page?: number;
}

/**
 * Search for users by name or email
 * @param query The search query (name or email)
 * @param limit Maximum number of results to return
 * @returns Promise with search results
 */
export async function searchUsers(
  query: string,
  limit: number = 10
): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return { users: [], total: 0 };
  }

  try {
    const params = new URLSearchParams({
      query,
      type: "users",
      limit: limit.toString(),
    });

    try {
      // Type assertion using 'as' without explicit 'any'
      const response = (await api.get(
        `/search?${params.toString()}`
      )) as ApiResponse;
      return response.data;
    } catch (apiError) {
      console.warn("Search API failed:", apiError);
      return { users: [], total: 0 };
    }
  } catch (error) {
    console.error("Error searching users:", error);
    return { users: [], total: 0 };
  }
}

/**
 * Search for properties
 * @param query The search query
 * @param limit Maximum number of results to return
 * @returns Promise with search results
 */
export async function searchProperties(
  query: string,
  limit: number = 10
): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return { properties: [], total: 0 };
  }

  try {
    const params = new URLSearchParams({
      query,
      type: "properties",
      limit: limit.toString(),
    });

    try {
      const response = (await api.get(
        `/search?${params.toString()}`
      )) as ApiResponse;
      return response.data;
    } catch (apiError) {
      console.warn("Properties search API failed:", apiError);
      return { properties: [], total: 0 };
    }
  } catch (error) {
    console.error("Error searching properties:", error);
    return { properties: [], total: 0 };
  }
}

/**
 * Perform a global search across multiple entity types
 * @param query The search query
 * @param limit Maximum number of results to return per type
 * @returns Promise with search results
 */
export async function searchAll(
  query: string,
  limit: number = 5
): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return { users: [], properties: [], total: 0 };
  }

  try {
    const params = new URLSearchParams({
      query,
      type: "all",
      limit: limit.toString(),
    });

    try {
      const response = (await api.get(
        `/search?${params.toString()}`
      )) as ApiResponse;
      return response.data;
    } catch (apiError) {
      console.warn("Global search API failed:", apiError);
      return { users: [], properties: [], total: 0 };
    }
  } catch (error) {
    console.error("Error performing global search:", error);
    return { users: [], properties: [], total: 0 };
  }
}

// Create a named constant for the exports to avoid the ESLint warning
const searchClient = {
  searchUsers,
  searchProperties,
  searchAll,
};

export default searchClient;
