/**
 * Feature flags and configuration
 */

import { getEnv, getBoolEnv, getNumEnv } from './environment';

// Feature flags
export const FEATURES = {
  ENABLE_MESSAGING: getBoolEnv("ENABLE_MESSAGING", true),
  ENABLE_NOTIFICATIONS: getBoolEnv("ENABLE_NOTIFICATIONS", true),
  ENABLE_FAVORITES: true,
  ENABLE_MAPS: true,
  ENABLE_PRICE_HISTORY: true,
};

// UI configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: getNumEnv("ITEMS_PER_PAGE", 10),
  PRIMARY_COLOR: getEnv("PRIMARY_COLOR", "#3B82F6"),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_LAT: getNumEnv("DEFAULT_LAT", 40.7128),
  DEFAULT_LNG: getNumEnv("DEFAULT_LNG", -74.006),
  MAPBOX_TOKEN: getEnv("MAPBOX_TOKEN", ""),
};

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

export default {
  FEATURES,
  UI_CONFIG,
  MAP_CONFIG,
  isFeatureEnabled
};
