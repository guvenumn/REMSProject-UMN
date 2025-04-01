// /frontend/src/config/index.ts
/**
 * REMS Centralized Configuration System
 *
 * This file serves as the single source of truth for all configuration values.
 * Import from this file rather than accessing process.env directly.
 */

import { getEnv, isDevelopment, isProduction } from "./environment";
import { ApiEndpoints } from "./types";
import { FEATURES, UI_CONFIG, MAP_CONFIG, isFeatureEnabled } from "./features";

// API URLs with proper fallbacks - always use secure connections in production
export const API_BASE_URL = getEnv("API_URL", "/api");
export const BROWSER_API_URL = getEnv("BROWSER_API_URL", "/api");
export const SOCKET_URL = getEnv(
  "SOCKET_URL",
  isProduction ? "wss://www.remsiq.com" : "ws://localhost:3002"
);

// App metadata
const APP_NAME = getEnv("APP_NAME", "Real Estate Management System");
const APP_VERSION = getEnv("APP_VERSION", "1.0.0");

// Authentication settings
const TOKEN_STORAGE_KEY = getEnv("TOKEN_STORAGE_KEY", "token");
const TOKEN_EXPIRY_KEY = getEnv("TOKEN_EXPIRY_KEY", "tokenExpiry");

// API endpoints structure
export const API_ENDPOINTS: ApiEndpoints = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USER: {
    PROFILE: "/user/profile",
    AVATAR: "/user/avatar",
    FAVORITES: "/user/favorites",
    NOTIFICATIONS: "/user/notifications",
    CHANGE_PASSWORD: "/user/change-password",
  },
  USERS: {
    BASE: "/users",
    SEARCH: "/users/search",
  },
  PROPERTIES: {
    BASE: "/properties",
    SEARCH: "/search/properties",
    IMAGES: "/properties/:id/images",
  },
  MESSAGES: {
    CONVERSATIONS: "/messages/conversations",
    UNREAD: "/messages/unread",
    INQUIRIES: "/messages/inquiries",
  },
  UPLOAD: {
    IMAGE: "/upload",
    AVATAR: "/upload/avatar",
    PROPERTY_IMAGE: "/upload/property-image",
    DOCUMENT: "/upload/document",
  },
};

// Export API_URLS for backward compatibility with existing code
export const API_URLS = {
  AUTH: API_ENDPOINTS.AUTH,
  USER: API_ENDPOINTS.USER,
  USERS: API_ENDPOINTS.USERS,
  PROPERTIES: API_ENDPOINTS.PROPERTIES,
  MESSAGES: API_ENDPOINTS.MESSAGES,
  UPLOAD: API_ENDPOINTS.UPLOAD,
  BASE: API_BASE_URL,
  BROWSER: BROWSER_API_URL,
  SOCKET: SOCKET_URL,
};

// Export the complete configuration object
export const config = {
  api: {
    url: API_BASE_URL,
    browserUrl: BROWSER_API_URL,
    socketUrl: SOCKET_URL,
    endpoints: API_ENDPOINTS,
  },
  app: {
    name: APP_NAME,
    version: APP_VERSION,
  },
  features: FEATURES,
  ui: UI_CONFIG,
  map: MAP_CONFIG,
  auth: {
    tokenKey: TOKEN_STORAGE_KEY,
    expiryKey: TOKEN_EXPIRY_KEY,
  },
  env: {
    isDevelopment,
    isProduction,
  },
};

// Helper functions
export {
  getApiUrl,
  formatApiUrl,
  getImageUrl,
  formatDate,
  formatCurrency,
} from "./helpers";
export { isFeatureEnabled } from "./features";

// Also export as default for convenience
export default config;
