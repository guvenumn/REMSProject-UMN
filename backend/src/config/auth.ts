// file: /backend/src/config/auth.ts
/**
 * Authentication configuration
 */

import { Secret } from "jsonwebtoken";

interface AuthConfig {
  jwtSecret: Secret;
  jwtExpiresIn: string;
  resetTokenExpiresIn: number;
  minPasswordLength: number;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number;
  };
  bcrypt: {
    saltRounds: number;
  };
}

const config: AuthConfig = {
  // JWT Secret - should be loaded from environment variable in production
  jwtSecret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development",

  // JWT expiration time
  jwtExpiresIn: "7d",

  // Password reset token expiration (in milliseconds)
  resetTokenExpiresIn: 24 * 60 * 60 * 1000, // 24 hours

  // Minimum password length
  minPasswordLength: 8,

  // Cookie settings
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Password hashing
  bcrypt: {
    saltRounds: 12,
  },
};

export default config;
