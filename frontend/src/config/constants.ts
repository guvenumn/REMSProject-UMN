// file /var/www/rems/frontend/src/config/constants.ts

/**
 * Configuration constants
 *
 * This file contains constants extracted from environment variables.
 * Used to avoid circular dependencies in helper functions.
 */

import {
  getEnv,
  getNumEnv,
  getBoolEnv,
  // isDevelopment,
  isProduction,
} from "./environment";

// API URLs with proper fallbacks
export const API_URL = getEnv("API_URL", "/api");
export const BROWSER_API_URL = getEnv("BROWSER_API_URL", "/api");
export const SOCKET_URL = getEnv(
  "SOCKET_URL",
  isProduction ? "wss://remsiq.com" : "ws://localhost:3002"
);

// App metadata
export const APP_NAME = getEnv("APP_NAME", "Real Estate Management System");
export const APP_VERSION = getEnv("APP_VERSION", "1.0.0");

// Feature flags
export const ENABLE_MESSAGING = getBoolEnv("ENABLE_MESSAGING", true);
export const ENABLE_NOTIFICATIONS = getBoolEnv("ENABLE_NOTIFICATIONS", true);

// UI settings
export const ITEMS_PER_PAGE = getNumEnv("ITEMS_PER_PAGE", 10);
export const PRIMARY_COLOR = getEnv("PRIMARY_COLOR", "#3B82F6");
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Map settings
export const DEFAULT_LAT = getNumEnv("DEFAULT_LAT", 40.7128);
export const DEFAULT_LNG = getNumEnv("DEFAULT_LNG", -74.006);
export const MAPBOX_TOKEN = getEnv("MAPBOX_TOKEN", "");

// Authentication settings
export const TOKEN_STORAGE_KEY = getEnv("TOKEN_STORAGE_KEY", "token");
export const TOKEN_EXPIRY_KEY = getEnv("TOKEN_EXPIRY_KEY", "tokenExpiry");

// File types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];
