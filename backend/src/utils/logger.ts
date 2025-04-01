/**
 * Simple logger utility for the application
 */

// Define log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

// Get log level from environment or use INFO as default
const getCurrentLevel = (): LogLevel => {
  const env = process.env.NODE_ENV || "development";
  if (env === "development") {
    return LogLevel.DEBUG;
  }
  return LogLevel.INFO;
};

// Current logging level
const currentLevel = getCurrentLevel();

// Format the log message
const formatLogMessage = (level: string, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

// Simple logger implementation
export const logger = {
  error: (message: any, ...args: any[]): void => {
    if (currentLevel >= LogLevel.ERROR) {
      console.error(formatLogMessage("ERROR", String(message)), ...args);
    }
  },

  warn: (message: any, ...args: any[]): void => {
    if (currentLevel >= LogLevel.WARN) {
      console.warn(formatLogMessage("WARN", String(message)), ...args);
    }
  },

  info: (message: any, ...args: any[]): void => {
    if (currentLevel >= LogLevel.INFO) {
      console.info(formatLogMessage("INFO", String(message)), ...args);
    }
  },

  http: (message: any, ...args: any[]): void => {
    if (currentLevel >= LogLevel.HTTP) {
      console.log(formatLogMessage("HTTP", String(message)), ...args);
    }
  },

  debug: (message: any, ...args: any[]): void => {
    if (currentLevel >= LogLevel.DEBUG) {
      console.debug(formatLogMessage("DEBUG", String(message)), ...args);
    }
  },
};
