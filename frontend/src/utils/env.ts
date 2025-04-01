// /var/www/rems/frontend/src/utils/env.ts
/**
 * Environment utility functions to safely access environment variables
 * with type checking and fallbacks
 */

/**
 * Get a string environment variable
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getEnvString(key: string, defaultValue: string = ""): string {
  const value = getBrowserEnv(key) || process.env[`NEXT_PUBLIC_${key}`];
  return value || defaultValue;
}

/**
 * Get a number environment variable
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set or not a number
 * @returns The environment variable value as a number or the default value
 */
export function getEnvNumber(key: string, defaultValue: number = 0): number {
  const value = getBrowserEnv(key) || process.env[`NEXT_PUBLIC_${key}`];
  if (!value) return defaultValue;

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get a boolean environment variable
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set
 * @returns The environment variable value as a boolean or the default value
 */
export function getEnvBoolean(
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = getBrowserEnv(key) || process.env[`NEXT_PUBLIC_${key}`];
  if (!value) return defaultValue;

  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get a JSON environment variable
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set or not valid JSON
 * @returns The parsed environment variable value or the default value
 */
export function getEnvJson<T>(key: string, defaultValue: T): T {
  const value = getBrowserEnv(key) || process.env[`NEXT_PUBLIC_${key}`];
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(
      `Failed to parse JSON from environment variable ${key}:`,
      error
    );
    return defaultValue;
  }
}

/**
 * Get environment variable from browser context
 * @param key The environment variable key
 * @returns The environment variable value or undefined
 */
function getBrowserEnv(key: string): string | undefined {
  if (typeof window !== "undefined" && window.__ENV) {
    return window.__ENV[key];
  }
  return undefined;
}

/**
 * Get API URL for server or client side
 * @returns The appropriate API URL for current context
 */
export function getApiUrl(): string {
  // Use browser-specific URL for client-side requests
  if (typeof window !== "undefined") {
    return getEnvString("BROWSER_API_URL", "/api");
  }

  // Use server-side URL for SSR
  return getEnvString("API_URL", "/api");
}

/**
 * Get socket URL
 * @returns The socket URL
 */
export function getSocketUrl(): string {
  return getEnvString("SOCKET_URL", typeof window !== "undefined" ? window.location.origin : "");
}

/**
 * Detect environment
 * @returns Whether the current environment is production
 */
export function isProduction(): boolean {
  return getEnvString("NODE_ENV") === "production";
}

/**
 * Check if a feature is enabled
 * @param feature The feature name
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  return getEnvBoolean(`ENABLE_${feature.toUpperCase()}`, false);
}

// Export public helper functions
export default {
  getEnvString,
  getEnvNumber,
  getEnvBoolean,
  getEnvJson,
  getApiUrl,
  getSocketUrl,
  isProduction,
  isFeatureEnabled,
};
