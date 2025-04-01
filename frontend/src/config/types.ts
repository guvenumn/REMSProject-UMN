/**
 * TypeScript type definitions for the configuration system
 */

// API Endpoints structure
export interface ApiEndpoints {
  AUTH: {
    LOGIN: string;
    REGISTER: string;
    LOGOUT: string;
    ME: string;
    FORGOT_PASSWORD: string;
    RESET_PASSWORD: string;
  };
  USER: {
    PROFILE: string;
    AVATAR: string;
    FAVORITES: string;
    NOTIFICATIONS: string;
    CHANGE_PASSWORD: string;
  };
  USERS: {
    BASE: string;
    SEARCH: string;
  };
  PROPERTIES: {
    BASE: string;
    SEARCH: string;
    IMAGES: string;
  };
  MESSAGES: {
    CONVERSATIONS: string;
    UNREAD: string;
    INQUIRIES: string;
  };
  UPLOAD: {
    IMAGE: string;
    AVATAR: string;
    PROPERTY_IMAGE: string;
    DOCUMENT: string;
  };
}

// Complete config structure
export interface AppConfig {
  api: {
    url: string;
    browserUrl: string;
    socketUrl: string;
    endpoints: ApiEndpoints;
  };
  app: {
    name: string;
    version: string;
  };
  features: {
    enableMessaging: boolean;
    enableNotifications: boolean;
  };
  ui: {
    itemsPerPage: number;
    primaryColor: string;
    maxFileSize: number;
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
  };
  map: {
    defaultLat: number;
    defaultLng: number;
    mapboxToken: string;
  };
  auth: {
    tokenKey: string;
    expiryKey: string;
  };
  env: {
    isDevelopment: boolean;
    isProduction: boolean;
  };
}
