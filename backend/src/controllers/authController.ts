// Path: /backend/src/controllers/authController.ts
import { Request as ExpressRequest, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError, BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";

// Extend the Express Request interface to include userId
interface Request extends ExpressRequest {
  userId?: string;
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
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for user: ${email}`);
    console.log(`Login attempt for user: ${email}`);

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
      return;
    }

    // Find user by email
    const user = await getPrismaClient()
      .user.findUnique({
        where: { email },
      })
      .catch((err: Error) => {
        logger.error(`Database error while finding user: ${err.message}`);
        throw new ApiError("Database error occurred", 500);
      });

    if (!user) {
      logger.info(`User not found for email: ${email}`);
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt
      .compare(password, user.password)
      .catch((err: Error) => {
        logger.error(`Error comparing passwords: ${err.message}`);
        throw new ApiError("Authentication error", 500);
      });

    if (!isPasswordValid) {
      logger.info(`Invalid password for user: ${email}`);
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Generate JWT token
    const jwtSecret =
      process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";
    const jwtExpiresIn = "7d";

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    // User data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`Login successful for user: ${email}`);
    console.log(`Login successful for user: ${email}`);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error}`);
    console.error(`Login error:`, error);
    next(error);
  }
};

/**
 * Register user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    logger.info(`Registration attempt for user: ${email}`);

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Please provide name, email, and password",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await getPrismaClient()
      .user.findUnique({
        where: { email },
      })
      .catch((err: Error) => {
        logger.error(
          `Database error while checking existing user: ${err.message}`
        );
        throw new ApiError("Database error occurred", 500);
      });

    if (existingUser) {
      logger.info(`User already exists with email: ${email}`);
      res.status(400).json({
        success: false,
        error: "Email already in use",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt
      .hash(password, 10)
      .catch((err: Error) => {
        logger.error(`Error hashing password: ${err.message}`);
        throw new ApiError("Error creating user", 500);
      });

    // Create user
    const user = await getPrismaClient()
      .user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER", // Default role
        },
      })
      .catch((err: Error) => {
        logger.error(`Database error while creating user: ${err.message}`);
        throw new ApiError("Error creating user", 500);
      });

    // Generate JWT token
    const jwtSecret =
      process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";
    const jwtExpiresIn = "7d";

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    // User data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`Registration successful for user: ${email}`);

    // Send success response
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error}`);
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User should be attached to request by auth middleware
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    // Get user from database
    const user = await getPrismaClient()
      .user.findUnique({
        where: { id: req.userId },
      })
      .catch((err: Error) => {
        logger.error(
          `Database error while getting current user: ${err.message}`
        );
        throw new ApiError("Database error occurred", 500);
      });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // User data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`Retrieved current user data for: ${req.userId}`);

    // Send success response
    res.status(200).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    logger.error(`Get current user error: ${error}`);
    next(error);
  }
};
/**
 * Update user password
 * POST /api/auth/change-password
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    logger.info(`Password update requested for user ${userId}`);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    // Get user from database
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.warn(`User not found for password update: ${userId}`);
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      logger.warn(`Invalid current password provided for user: ${userId}`);
      res.status(401).json({
        success: false,
        message: "incorrect_password",
      });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await getPrismaClient().user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password successfully updated for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error("Error in updatePassword:", error);
    next(error);
  }
};
/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    logger.info("Logout attempt");

    // There's not much to do for JWT logout on the server side
    // as JWTs are stateless, but we can clear any cookies if needed

    // Send success response
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(`Logout error: ${error}`);
    next(error);
  }
};
