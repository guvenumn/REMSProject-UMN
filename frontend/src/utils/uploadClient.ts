// Path: /var/www/rems/frontend/src/utils/uploadClient.ts
import { uploadFile } from "./apiClient";
// Remove unused import: import { getEnvString } from "./env";
import { UI_CONFIG } from "@/config/features";

// Get the uploadable file types from centralized config
const ALLOWED_IMAGE_TYPES = UI_CONFIG.ALLOWED_IMAGE_TYPES;
const ALLOWED_DOCUMENT_TYPES = UI_CONFIG.ALLOWED_DOCUMENT_TYPES;
const MAX_FILE_SIZE = UI_CONFIG.MAX_FILE_SIZE;

/**
 * Upload a property image
 */
export async function uploadPropertyImage(file: File) {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Please upload a JPG, PNG, WebP, or GIF.",
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return uploadFile(file, "/upload/property-image", "image");
}

/**
 * Upload a profile avatar
 */
export async function uploadAvatar(file: File) {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Please upload a JPG, PNG, WebP, or GIF.",
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  // Changed endpoint from "/upload/avatar" to "/user/avatar" to match backend API
  return uploadFile(file, "/user/avatar", "avatar");
}

/**
 * Upload a document file (PDF, DOC, DOCX, etc.)
 */
export async function uploadDocument(file: File) {
  // Validate file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      success: false,
      error:
        "Invalid file type. Please upload a PDF, DOC, DOCX, XLS, XLSX, or TXT file.",
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return uploadFile(file, "/upload/document", "document");
}

/**
 * Get the full URL for a file path
 * This implementation properly handles CORS issues by using relative paths
 */
export function getFileUrl(path: string): string {
  if (!path) {
    return "/images/properties/property-placeholder.jpeg";
  }

  try {
    // If it's already an absolute URL, return it
    if (path.startsWith("http://") || path.startsWith("https://")) {
      // Extract the path part from absolute URLs when applicable
      try {
        const url = new URL(path);

        // If URL points to a specific server we know, use relative path
        if (typeof window !== "undefined") {
          // Convert hardcoded backend references to relative paths
          if (
            url.hostname === "24.144.115.137" ||
            url.hostname === "localhost" ||
            url.hostname === window.location.hostname
          ) {
            return url.pathname;
          }
        }

        return path;
      } catch {
        // Ignore URL parsing errors without using the error variable
        return path;
      }
    }

    // For paths that start with /uploads, use the frontend path
    // This will be handled by Next.js rewrites
    if (path.startsWith("/uploads")) {
      return path;
    }

    // Add leading slash if needed
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // If it's a uploads path but without the /uploads prefix
    if (
      normalizedPath.includes("properties/") ||
      normalizedPath.includes("avatars/") ||
      normalizedPath.includes("documents/")
    ) {
      return `/uploads${normalizedPath}`;
    }

    // Return the path as is to be handled by Next.js
    return normalizedPath;
  } catch (error) {
    console.error("Error processing file URL:", error);
    return "/images/properties/property-placeholder.jpeg";
  }
}

/**
 * Get the full image URL from a path (alias for getFileUrl to maintain backward compatibility)
 */
export function getImageUrl(path: string): string {
  return getFileUrl(path);
}

/**
 * Convert a file to base64 string (useful for previews)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate if a file is an acceptable image
 */
export function isValidImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
}

/**
 * Validate if a file is an acceptable document
 */
export function isValidDocument(file: File): boolean {
  return (
    ALLOWED_DOCUMENT_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
  );
}

// Export utility functions as a named constant to avoid linting warning
export const uploadUtils = {
  uploadPropertyImage,
  uploadAvatar,
  uploadDocument,
  getFileUrl,
  getImageUrl,
  fileToBase64,
  isValidImage,
  isValidDocument,
};

export default uploadUtils;
