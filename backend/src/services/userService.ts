// file: /var/www/rems/backend/src/services/userService.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  BadRequestError,
  ApiError,
  ConflictError,
} from "../utils/errors";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
import config from "../config";

const prisma = new PrismaClient();

/**
 * User Service - Contains business logic for user operations
 * This layer sits between controllers and the database
 */
export const userService = {
  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    logger.info(`[userService] Getting user by ID: ${userId}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  },

  /**
   * Get user profile with statistics
   */
  getUserProfile: async (userId: string) => {
    logger.info(`[userService] Getting profile for user: ${userId}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get user's saved properties count
    const savedCount = await prisma.savedProperty.count({
      where: { userId },
    });

    // Get user's property inquiries count
    const inquiriesCount = await prisma.propertyInquiry.count({
      where: { userId },
    });

    // Return user data without password
    const { password, ...userData } = user;

    return {
      ...userData,
      stats: {
        savedProperties: savedCount,
        inquiries: inquiriesCount,
      },
    };
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (
    userId: string,
    data: { name?: string; phone?: string | null; avatarUrl?: string | null }
  ) => {
    logger.info(`[userService] Updating profile for user: ${userId}`);

    // Validate input
    if (data.name !== undefined && (!data.name || data.name.trim() === "")) {
      throw new BadRequestError("Name is required");
    }

    // Update user
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
        },
      });

      // Return user without password
      const { password, ...userData } = updatedUser;
      return userData;
    } catch (error) {
      logger.error(`[userService] Error updating user profile: ${error}`);
      throw new ApiError("Failed to update user profile", 500);
    }
  },

  /**
   * Upload and process avatar
   */
  processAvatar: async (userId: string, file: Express.Multer.File) => {
    logger.info(`[userService] Processing avatar for user: ${userId}`);

    if (!file) {
      throw new BadRequestError("No image provided");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    try {
      // Delete old avatar if exists and not a default image
      if (
        user.avatarUrl &&
        !user.avatarUrl.includes("default") &&
        fs.existsSync(
          path.join(config.upload.avatarsDir, path.basename(user.avatarUrl))
        )
      ) {
        fs.unlinkSync(
          path.join(config.upload.avatarsDir, path.basename(user.avatarUrl))
        );
      }

      // Set new avatar URL
      const avatarUrl = `/uploads/avatars/${file.filename}`;

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return { avatarUrl };
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      logger.error(`[userService] Error processing avatar: ${error}`);
      throw new ApiError("Failed to process avatar", 500);
    }
  },

  /**
   * Get user favorites
   */
  getUserFavorites: async (userId: string) => {
    logger.info(`[userService] Getting favorites for user: ${userId}`);

    // Get saved properties IDs
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId },
      select: { propertyId: true },
    });

    // Get properties
    const properties = await prisma.property.findMany({
      where: {
        id: { in: savedProperties.map((sp) => sp.propertyId) },
      },
      include: {
        images: {
          take: 1,
          orderBy: { orderIndex: "asc" },
        },
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return properties;
  },

  /**
   * Change user password
   */
  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    logger.info(`[userService] Changing password for user: ${userId}`);

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new BadRequestError(
        "Current password and new password are required"
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async () => {
    logger.info(`[userService] Getting all users`);

    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        phone: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: "USER" | "AGENT" | "ADMIN";
      phone?: string | null;
    }
  ) => {
    logger.info(`[userService] Admin updating user: ${userId}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // If email is changing, check if it's already in use
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictError("Email already in use");
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        phone: true,
      },
    });

    return updatedUser;
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (userId: string) => {
    logger.info(`[userService] Admin deleting user: ${userId}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return true;
  },
};

export default userService;
