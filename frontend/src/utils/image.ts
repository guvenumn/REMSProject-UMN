// Path: /frontend/src/utils/image.ts

// Removed unused import of environment

/**
 * Get the proper URL for an image based on its path or URL
 */
export function getImageUrl(path?: string | null): string {
  if (!path) {
    return "/images/placeholder.jpeg";
  }

  // If it's already a full URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    // If it points to the backend server, rewrite it
    if (path.includes("24.144.115.137:3002")) {
      // Extract the path part from the URL
      try {
        const url = new URL(path);
        return url.pathname; // Let Next.js handle the rewrite
      } catch {
        // Removed unused 'e' parameter
        return path;
      }
    }
    return path;
  }

  // Handle relative paths
  if (path.startsWith("/")) {
    return path;
  }

  // Assume it's a relative path to uploads
  return `/uploads/${path}`;
}

/**
 * Define a Property interface to avoid using 'any'
 */
interface PropertyWithImages {
  imageUrl?: string;
  images?: Array<string | { url: string }>;
  [key: string]: unknown;
}

/**
 * Get the primary image URL from a property
 */
export function getPropertyImageUrl(property: PropertyWithImages): string {
  // Handle different property image formats
  if (property.imageUrl) {
    return getImageUrl(property.imageUrl);
  }

  if (property.images && property.images.length > 0) {
    // Handle both string arrays and object arrays
    const firstImage = property.images[0];
    if (typeof firstImage === "string") {
      return getImageUrl(firstImage);
    }
    if (typeof firstImage === "object" && firstImage && "url" in firstImage) {
      return getImageUrl(firstImage.url);
    }
  }

  return "/images/properties/property-placeholder.jpeg";
}

// Created a named export object to avoid anonymous default export
const imageUtils = {
  getImageUrl,
  getPropertyImageUrl,
};

export default imageUtils;
