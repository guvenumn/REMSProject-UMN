// Path: /frontend/src/utils/apiClient.ts

import { getAccessToken } from "./authClient";
import { getEnvString } from "./env";

type ApiRequestData = Record<string, unknown>;

// Get the API URL from environment
const API_URL = getEnvString("API_URL", "/api");

// Log the API URL being used for debugging
console.log("API Client initialized with base URL:", API_URL);

// Constants
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

// Helper sleep function for retry delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to build API path correctly
const buildPath = (endpoint: string): string => {
  // Remove /api prefix if it exists (to avoid /api/api)
  if (endpoint.startsWith("/api/")) {
    endpoint = endpoint.substring(4);
  }
  // Add leading slash if missing
  if (!endpoint.startsWith("/")) {
    endpoint = "/" + endpoint;
  }
  return endpoint;
};

// Fetch with retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 0
): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    if (retries < MAX_RETRIES) {
      console.log(
        `API request failed, retrying (${retries + 1}/${MAX_RETRIES})...`,
        error
      );
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries + 1);
    }
    if (
      error instanceof TypeError &&
      (error.message.includes("fetch failed") ||
        error.message.includes("Failed to fetch"))
    ) {
      console.error("Network error - backend service may be unavailable");
      if (process.env.NODE_ENV === "development") {
        console.info(
          `Please ensure your backend server is running at ${
            API_URL.split("/api")[0]
          }`
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Backend service unavailable",
          message: "Unable to connect to the server. Please try again later.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    throw error;
  }
}

// Fetch with auth token
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const requestOptions: RequestInit = { ...options, headers };
  const response = await fetchWithRetry(url, requestOptions);
  if (response.status === 401) {
    console.log("Unauthenticated request - token may be expired");
    // Implement token refresh logic here if needed
  }
  return response;
}

// Process API response
async function processResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();
  console.log(
    `API Response [${response.status}]:`,
    isJson ? "JSON Response" : "Text Response",
    response.url
  );
  if (!response.ok) {
    const error = isJson && data.error ? data.error : response.statusText;
    const message = isJson && data.message ? data.message : "An error occurred";
    console.error("API Error Details:", {
      status: response.status,
      error,
      message,
      url: response.url,
    });
    throw { status: response.status, error, message, data: data.data || null };
  }
  return data;
}

// Create API client object with methods
export const api = {
  async get(endpoint: string, options: RequestInit = {}) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] GET request to: ${url}`);
    const response = await fetchWithAuth(url, { method: "GET", ...options });
    return processResponse(response);
  },

  async post(
    endpoint: string,
    data: ApiRequestData = {},
    options: RequestInit = {}
  ) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] POST request to: ${url}`, data);
    const response = await fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
    return processResponse(response);
  },

  async put(
    endpoint: string,
    data: ApiRequestData = {},
    options: RequestInit = {}
  ) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] PUT request to: ${url}`, data);
    const response = await fetchWithAuth(url, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
    return processResponse(response);
  },

  async patch(
    endpoint: string,
    data: ApiRequestData = {},
    options: RequestInit = {}
  ) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] PATCH request to: ${url}`, data);
    const response = await fetchWithAuth(url, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
    return processResponse(response);
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] DELETE request to: ${url}`);
    const response = await fetchWithAuth(url, { method: "DELETE", ...options });
    return processResponse(response);
  },

  async postFormData(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ) {
    const formattedEndpoint = buildPath(endpoint);
    const url = `${API_URL}${formattedEndpoint}`;
    console.log(`[API] POST FormData to: ${url}`);
    const token = getAccessToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetchWithRetry(url, {
      method: "POST",
      body: formData,
      headers,
      ...options,
    });
    return processResponse(response);
  },

  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      const response = await fetch(`${API_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("Backend connection test failed:", error);
      return false;
    }
  },

  isAuthAvailable() {
    return typeof getAccessToken === "function";
  },
};

// For individual function exports
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const deleteRequest = api.delete; // Renamed to avoid conflict with 'delete' keyword
export const postFormData = api.postFormData;

// Add the uploadFile function for file uploads
export async function uploadFile(
  file: File,
  path: string = "/upload",
  fieldName: string = "file"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log(`[apiClient] Uploading file to ${path}:`, file.name);
    const formData = new FormData();
    formData.append(fieldName, file);
    const formattedPath = buildPath(path);
    const url = `${API_URL}${formattedPath}`;
    const token = getAccessToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(`[apiClient] Upload failed (${response.status}):`, data);
      return {
        success: false,
        error: data.message || `Upload failed with status ${response.status}`,
      };
    }
    const fileUrl = data.url || (data.data && data.data.url) || null;
    if (!fileUrl) {
      console.warn(
        "[apiClient] Upload succeeded but no URL in response:",
        data
      );
    }
    return { success: true, url: fileUrl };
  } catch (error: unknown) {
    console.error("[apiClient] Error during file upload:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

export default api;
