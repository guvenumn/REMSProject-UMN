// Path: /frontend/src/config/helpers.ts

/**
 * Helper functions for working with configuration values
 */

import { isBrowser } from "./environment";

// Import constants but not the full config to avoid circular dependencies
import { API_URL, BROWSER_API_URL } from "./constants";

/**
 * Get the full API URL for a given endpoint
 *
 * @param endpoint Endpoint path (with or without leading slash)
 * @param useBrowserUrl Whether to use the browser URL (default: true)
 * @returns The full API URL
 */
export function getApiUrl(endpoint: string, useBrowserUrl = true): string {
  // If it's already a full URL, return as is
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  // Normalize the endpoint path (remove leading slash if present)
  const path = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;

  // Choose the appropriate base URL
  const baseUrl = useBrowserUrl && isBrowser ? BROWSER_API_URL : API_URL;

  // Handle potential double slashes
  if (baseUrl.endsWith("/") && path.startsWith("/")) {
    return `${baseUrl}${path.substring(1)}`;
  }

  // Handle missing slashes
  if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }

  // Normal case
  return `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}${path}`;
}

/**
 * Format an API URL with path parameters
 *
 * @param path The endpoint path with placeholders
 * @param params The parameter values to substitute
 * @returns The formatted URL
 */
export function formatApiUrl(
  path: string,
  params: Record<string, string> = {}
): string {
  let url = path;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  });

  return url;
}

/**
 * Get the appropriate URL for an image or file
 *
 * @param path Image path or URL
 * @returns The full image URL
 */
export function getImageUrl(path: string): string {
  if (!path) {
    return "/images/properties/property-placeholder.jpeg";
  }

  try {
    // If it's already an absolute URL
    if (path.startsWith("http://") || path.startsWith("https://")) {
      try {
        // Extract just the path if it's on our domain or an IP we recognize
        const url = new URL(path);

        // Check if this URL should be converted to a relative path
        if (isBrowser) {
          // If using the same hostname as our page or a known API server
          if (
            url.hostname === window.location.hostname ||
            url.hostname === "24.144.115.137" || // Legacy IP, convert to relative path
            url.hostname === "24.144.115.137" ||
            url.hostname === "remsiq.com" ||
            url.hostname === "www.remsiq.com" ||
            url.hostname === "localhost"
          ) {
            return url.pathname;
          }
        }

        return path;
      } catch (e) {
        return path;
      }
    }

    // For paths that start with /uploads, use as is
    if (path.startsWith("/uploads")) {
      return path;
    }

    // Add leading slash if needed
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // If it's an uploads path but missing the /uploads prefix
    if (
      normalizedPath.includes("properties/") ||
      normalizedPath.includes("avatars/") ||
      normalizedPath.includes("documents/")
    ) {
      return `/uploads${normalizedPath}`;
    }

    // Return the path as is
    return normalizedPath;
  } catch (error) {
    console.error("Error processing image URL:", error);
    return "/images/properties/property-placeholder.jpeg";
  }
}

/**
 * Format a date string using the current locale
 *
 * @param date Date to format
 * @param format Formatting style
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  format: "short" | "medium" | "long" | "full" = "medium"
): string {
  if (!date) return "";

  try {
    const dateObj =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;

    if (isNaN(dateObj.getTime())) return "";

    const options: Intl.DateTimeFormatOptions = {};

    switch (format) {
      case "short":
        options.month = "numeric";
        options.day = "numeric";
        options.year = "2-digit";
        break;
      case "medium":
        options.month = "short";
        options.day = "numeric";
        options.year = "numeric";
        break;
      case "long":
        options.month = "long";
        options.day = "numeric";
        options.year = "numeric";
        options.weekday = "short";
        break;
      case "full":
        options.month = "long";
        options.day = "numeric";
        options.year = "numeric";
        options.weekday = "long";
        options.hour = "2-digit";
        options.minute = "2-digit";
        break;
    }

    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Format a number as currency
 *
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
