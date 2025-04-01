// Path: /backend/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import config from "../config";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";
import { UserRole } from "../types/user";

// Make sure TypeScript knows about our custom properties on Request
// This is a type-safety check - the actual extension is in express/index.d.ts
declare module "express" {
  interface Request {
    userId?: string;
    userRole?: UserRole;
    user?: {
      id: string;
      email?: string;
      name?: string;
      role?: string;
      [key: string]: any;
    };
  }
}

// Initialize PrismaClient
let prisma: PrismaClient;

// Handle Prisma initialization
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Failed to initialize Prisma client:", error);
  // Use a lazy initialization approach
  prisma = null as unknown as PrismaClient;
}

// Function to get or initialize prisma client
const getPrismaClient = () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      console.error("Failed to initialize Prisma client:", error);
      throw new ApiError("Database connection error", 500);
    }
  }
  return prisma;
};

/**
 * Authenticate middleware
 * Verifies JWT token and adds userId to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    logger.info("Token received, verifying...");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { id: string };
    logger.info(`Token verified for user ID: ${decoded.id}`);

    // Set userId in request
    req.userId = decoded.id;

    // Get user from database to check if they still exist and get their role
    const user = await getPrismaClient().user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError("User not found", 401);
    }

    // Set user info in request
    req.user = user;
    req.userRole = user.role as UserRole;
    logger.info(`User authenticated: ${user.email}`);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError("Invalid token", 401));
    }
    next(error);
  }
};

/**
 * Require admin middleware
 * Ensures the user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.userRole !== "ADMIN") {
    return next(new ApiError("Admin privileges required", 403));
  }
  next();
};

/**
 * Require agent middleware
 * Ensures the user has agent or admin role
 */
export const requireAgent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || (req.userRole !== "AGENT" && req.userRole !== "ADMIN")) {
    return next(new ApiError("Agent privileges required", 403));
  }
  next();
};