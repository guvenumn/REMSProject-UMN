// Path: /backend/src/config/upload.ts
/**
 * Upload configuration
 */

import path from "path";

interface UploadConfig {
  imagesDir: string;
  avatarsDir: string;
  propertiesDir: string;
  maxFileSize: number;
  allowedImageTypes: string[];
  maxFiles: number;
}

const config: UploadConfig = {
  // Upload directories
  imagesDir: path.join(process.cwd(), "uploads/images"),
  avatarsDir: path.join(process.cwd(), "uploads/avatars"),
  propertiesDir: path.join(process.cwd(), "uploads/properties"),

  // Maximum file size in bytes (5MB)
  maxFileSize: 5 * 1024 * 1024,

  // Allowed image types
  allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  // Maximum files per upload
  maxFiles: 10,
};

export default config;
