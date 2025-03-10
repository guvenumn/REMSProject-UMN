// Path: /frontend/src/utils/apiClient.ts
import { getAccessToken, refreshToken } from "./authClient";

// Change this to match your actual backend URL
// Using the server IP instead of localhost to avoid CORS issues
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Normalize endpoint to avoid duplicate /api prefixes
 * This ensures endpoints work whether they include /api or not
 */
function normalizeEndpoint(endpoint: string): string {
  // If it's a full URL, return as is
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  // Remove leading slash if present for consistency
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint.substring(1)
    : endpoint;

  // Check if endpoint already starts with 'api/'
  if (cleanEndpoint.startsWith("api/")) {
    // Remove the 'api/' prefix to avoid duplication
    return cleanEndpoint.substring(4);
  }

  return cleanEndpoint;
}

/**
 * Generic fetch function with authentication
 */
export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Normalize the endpoint to avoid duplicate /api prefixes
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}/${normalizedEndpoint}`;

  // Set up headers
  const headers = new Headers(fetchOptions.headers);

  if (
    !headers.has("Content-Type") &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Add authentication token if required
  if (!skipAuth) {
    try {
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (error) {
      console.error("Failed to get access token:", error);
    }
  }

  // Prepare request
  const request: RequestInit = {
    ...fetchOptions,
    headers,
    // Add credentials to handle cookies properly
    credentials: "include",
  };

  // Make request
  try {
    let response = await fetch(url, request);

    // Handle token expiration (status 401)
    if (response.status === 401 && !skipAuth) {
      try {
        // Try to refresh the token
        const refreshed = await refreshToken();

        if (refreshed) {
          // Get new token and retry the request
          const newToken = getAccessToken();

          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            response = await fetch(url, { ...request, headers });
          }
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Token refresh failed, proceed with original 401 response
      }
    }

    // Parse response
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP Error ${response.status}`;
      } catch {
        errorMessage = `HTTP Error ${response.status}`;
      }

      throw new Error(`API Error: ${errorMessage}`);
    }

    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Handle different content types
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await response.json();
    } else if (contentType?.includes("text/")) {
      const text = await response.text();
      return { text } as unknown as T;
    } else {
      const blob = await response.blob();
      return { blob } as unknown as T;
    }
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Special function for file uploads
 */
export async function uploadFile<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  // Don't add Content-Type header for FormData
  // The browser will set it with the correct boundary
  return fetchWithAuth<T>(endpoint, {
    method: "POST",
    body: formData,
    ...options,
  });
}

// Helper functions for common HTTP methods
export async function get<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: "GET",
    ...options,
  });
}

export async function post<T = any>(
  endpoint: string,
  data: any,
  options: RequestOptions = {}
): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function put<T = any>(
  endpoint: string,
  data: any,
  options: RequestOptions = {}
): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function del<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: "DELETE",
    ...options,
  });
}

export default {
  fetchWithAuth,
  uploadFile,
  get,
  post,
  put,
  del,
};
