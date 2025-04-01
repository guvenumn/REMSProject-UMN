// file: /var/www/rems/frontend/src/lib/apiProxy.ts

/**
 * Helper file to centralize the proxying of API requests
 * This ensures consistent handling of headers, error responses, etc.
 */
import { API_BASE_URL } from "../config";

// Define more specific types instead of using 'any'
export type RequestBody = Record<string, unknown> | string | FormData | null;

export interface ProxyRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: RequestBody;
  authRequired?: boolean;
  timeout?: number;
}

// Define response types
export interface ProxyResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Proxies a request to the backend API
 */
export async function proxyToBackend(
  endpoint: string,
  options: ProxyRequestOptions = {}
): Promise<ProxyResponse> {
  const {
    method = "GET",
    headers = {},
    body,
    timeout = 15000, // 15 seconds default
    // authRequired is kept but not used currently - might be used in future
  } = options;

  // Normalize endpoint
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.substring(1)
    : endpoint;

  // Determine correct backend URL using centralized configuration
  const apiBaseWithoutSuffix = API_BASE_URL.replace(/\/api$/, "");
  const url = `${apiBaseWithoutSuffix}/api/${normalizedEndpoint}`;

  console.log(`Proxying ${method} request to: ${url}`);

  // Prepare request headers
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    // credentials: "include",
  };

  // Add body if provided
  if (body) {
    requestOptions.body =
      typeof body === "string" || body instanceof FormData
        ? body
        : JSON.stringify(body);

    // Set content type header if not already set
    if (!requestHeaders["Content-Type"] && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    // Make the request
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    // Try to parse response as JSON
    let responseData;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        responseData = { message: "Invalid JSON response from server" };
      }
    } else {
      // For non-JSON responses, return the text
      const text = await response.text();
      responseData = { text };
    }

    // Return both the response status and data
    return {
      ok: response.ok,
      status: response.status,
      data: responseData,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.error("Error in proxy request:", error);

    // If it's an abort error, it's a timeout
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 408, // Request Timeout
        data: { message: `Request timed out after ${timeout}ms` },
      };
    }

    // Handle generic errors by ensuring it's converted to a proper Error object
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      ok: false,
      status: 0, // Network error
      data: { message: errorMessage || "Network error" },
    };
  }
}

/**
 * Helper function to proxy GET requests
 */
export async function proxyGet(
  endpoint: string,
  options: ProxyRequestOptions = {}
): Promise<ProxyResponse> {
  return proxyToBackend(endpoint, { ...options, method: "GET" });
}

/**
 * Helper function to proxy POST requests
 */
export async function proxyPost(
  endpoint: string,
  body: RequestBody,
  options: ProxyRequestOptions = {}
): Promise<ProxyResponse> {
  return proxyToBackend(endpoint, { ...options, method: "POST", body });
}

/**
 * Helper function to proxy PUT requests
 */
export async function proxyPut(
  endpoint: string,
  body: RequestBody,
  options: ProxyRequestOptions = {}
): Promise<ProxyResponse> {
  return proxyToBackend(endpoint, { ...options, method: "PUT", body });
}

/**
 * Helper function to proxy DELETE requests
 */
export async function proxyDelete(
  endpoint: string,
  options: ProxyRequestOptions = {}
): Promise<ProxyResponse> {
  return proxyToBackend(endpoint, { ...options, method: "DELETE" });
}

// Create a named variable for the export to avoid anonymous default export
export const apiProxy = {
  proxyToBackend,
  proxyGet,
  proxyPost,
  proxyPut,
  proxyDelete,
};

// Export as default for backward compatibility
export default apiProxy;
