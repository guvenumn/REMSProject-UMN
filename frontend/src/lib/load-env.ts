// Path: /frontend/src/lib/load-env.ts

/**
 * This script loads environment variables during server-side rendering
 * and makes them available to client-side code
 */

import fs from "fs";
import path from "path";

// Since dotenv is only needed server-side, use dynamic import to avoid client-side errors
const loadDotenv = async () => {
  // Only import in a server environment
  if (typeof window === "undefined") {
    const { default: dotenv } = await import("dotenv");
    return dotenv;
  }
  return null;
};

// Define the environment variable prefix
const ENV_PREFIX = "NEXT_PUBLIC_";

/**
 * Load environment variables from .env files
 * This follows Next.js loading priority:
 * 1. .env.$(NODE_ENV).local
 * 2. .env.local (unless NODE_ENV is test)
 * 3. .env.$(NODE_ENV)
 * 4. .env
 */
export async function loadEnvConfig(
  dir: string,
  dev?: boolean
): Promise<{ combinedEnv: Record<string, string>; loadedEnvFiles: string[] }> {
  const mode = process.env.NODE_ENV;
  const isTest = mode === "test";

  const dotenvFiles = [
    `.env.${mode}.local`,
    // Don't include .env.local for tests
    ...(isTest ? [] : [".env.local"]),
    `.env.${mode}`,
    ".env",
  ];

  const loadedEnvFiles: string[] = [];
  const combinedEnv: Record<string, string> = {
    ...(process.env as Record<string, string>),
  };

  // Load dotenv dynamically to avoid client-side errors
  const dotenv = await loadDotenv();

  if (!dotenv) {
    console.warn(
      "dotenv not loaded, environment variables might not be available"
    );
    return { combinedEnv, loadedEnvFiles };
  }

  for (const envFile of dotenvFiles) {
    try {
      const filePath = path.join(dir, envFile);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const parsedEnv =
        dotenv.parse(fs.readFileSync(filePath).toString()) || {};
      loadedEnvFiles.push(envFile);

      // Merge with existing environment
      for (const key of Object.keys(parsedEnv)) {
        // Only set if not already defined
        if (!(key in combinedEnv)) {
          combinedEnv[key] = parsedEnv[key];
        }
      }
    } catch (err) {
      console.error(`Error loading .env file: ${envFile}`, err);
    }
  }

  return { combinedEnv, loadedEnvFiles };
}

/**
 * Get a subset of environment variables that are prefixed with NEXT_PUBLIC_
 * These are safe to expose to the client
 */
export function getClientEnv(): Record<string, string> {
  const clientEnv: Record<string, string> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith(ENV_PREFIX)) {
      clientEnv[key.replace(ENV_PREFIX, "")] = value || "";
    }
  });

  return clientEnv;
}

/**
 * Generate JavaScript code that sets the environment variables in the browser
 */
export function generateClientEnvScript(): string {
  const clientEnv = getClientEnv();

  return `
    window.__ENV = ${JSON.stringify(clientEnv)};
    console.log('Environment variables loaded');
  `;
}

const envLoader = {
  loadEnvConfig,
  getClientEnv,
  generateClientEnvScript,
};

export default envLoader;
