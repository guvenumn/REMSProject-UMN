/**
 * Type definitions for configuration
 */

export interface ApiUrls {
  BASE: string;
  BROWSER: string;
  SOCKET: string;
  
  AUTH: {
    LOGIN: string;
    REGISTER: string;
    ME: string;
    FORGOT_PASSWORD: string;
    RESET_PASSWORD: string;
  };

  USERS: {
    BASE: string;
    PROFILE: string;
  };

  PROPERTIES: {
    BASE: string;
    SEARCH: string;
  };

  MESSAGES: {
    CONVERSATIONS: string;
    UNREAD: string;
  };

  UPLOAD: {
    IMAGE: string;
    AVATAR: string;
  };
}

export interface AppConfig {
  APP: {
    NAME: string;
    VERSION: string;
    ENVIRONMENT: string;
  };

  FEATURES: {
    ENABLE_FAVORITES: boolean;
    ENABLE_MESSAGING: boolean;
    ENABLE_NOTIFICATIONS: boolean;
    ENABLE_ADMIN: boolean;
  };

  AUTH: {
    TOKEN_KEY: string;
    USER_KEY: string;
    TOKEN_EXPIRY_KEY: string;
    REFRESH_TOKEN_KEY: string;
  };

  API: {
    TIMEOUT: number;
    RETRY_COUNT: number;
    RETRY_DELAY: number;
  };

  SOCKET: {
    RECONNECTION_ATTEMPTS: number;
    RECONNECTION_DELAY: number;
    RECONNECTION_DELAY_MAX: number;
    TIMEOUT: number;
  };

  UI: {
    THEME: string;
    PRIMARY_COLOR: string;
    SECONDARY_COLOR: string;
    DANGER_COLOR: string;
    WARNING_COLOR: string;
    SUCCESS_COLOR: string;
    ITEMS_PER_PAGE: number;
    MAX_FILE_SIZE: number;
    ALLOWED_IMAGE_TYPES: string[];
  };

  MAP: {
    DEFAULT_CENTER: {
      lat: number;
      lng: number;
    };
    DEFAULT_ZOOM: number;
  };
}

// Declare global window interface for environment variables
declare global {
  interface Window {
    __ENV?: Record<string, string>;
  }
}
