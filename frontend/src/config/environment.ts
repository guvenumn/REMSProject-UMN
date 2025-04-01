/**
 *  File /var/www/rems/frontend/src/config/environment.ts
 * Environment variable handling
 *
 * This module provides safe access to environment variables with
 * proper type conversion and fallbacks.
 */

// Add type definition for window.__ENV
declare global {
  interface Window {
    __ENV?: Record<string, string>;
  }
}

/**
 * Get an environment variable with type safety and fallbacks
 *
 * @param key Environment variable name (without NEXT_PUBLIC_ prefix)
 * @param defaultValue Fallback value if env var is not defined
 * @returns The environment variable value or the default
 */
export function getEnv<T extends string | number | boolean>(
  key: string,
  defaultValue: T
): T {
  const envKey = `NEXT_PUBLIC_${key}`;

  // Try window.__ENV first (client-side)
  if (typeof window !== "undefined" && window.__ENV) {
    const value = window.__ENV[key];
    if (value !== undefined) return value as unknown as T;
  }

  // Then try process.env
  const processValue = process.env[envKey];

  // Return the value or default
  return (processValue !== undefined
    ? processValue
    : defaultValue) as unknown as T;
}

/**
 * Get a boolean environment variable
 *
 * @param key Environment variable name (without NEXT_PUBLIC_ prefix)
 * @param defaultValue Fallback value if env var is not defined
 * @returns The boolean value
 */
export function getBoolEnv(key: string, defaultValue: boolean): boolean {
  const value = getEnv(key, defaultValue ? "true" : "false");
  return value === "true";
}

/**
 * Get a numeric environment variable
 *
 * @param key Environment variable name (without NEXT_PUBLIC_ prefix)
 * @param defaultValue Fallback value if env var is not defined
 * @returns The numeric value
 */
export function getNumEnv(key: string, defaultValue: number): number {
  const value = getEnv(key, defaultValue.toString());
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Environment detection
export type NodeEnvType = "development" | "production" | "test";
export const nodeEnv = getEnv("NODE_ENV", "development") as NodeEnvType;
export const isDevelopment = nodeEnv === "development";
export const isProduction = nodeEnv === "production";
export const isTest = nodeEnv === "test";

// Browser/server detection
export const isBrowser = typeof window !== "undefined";
export const isServer = !isBrowser;

// Add the environment object export
export const environment = {
  apiBaseUrl: getEnv("API_BASE_URL", ""),
  nodeEnv,
  isDevelopment,
  isProduction,
  isTest,
};
