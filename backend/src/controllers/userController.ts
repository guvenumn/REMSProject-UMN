// Path: /backend/src/controllers/userController.ts

import { Request, Response, NextFunction } from "express";
import { userService } from "../services/userService";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add this to the existing userController object
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check admin permissions (should already be handled by middleware)
    if (!req.user || req.userRole !== "ADMIN") {
      throw new ApiError("Admin privileges required", 403);
    }

    const { name, email, password, role, phone, active } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new ApiError("Name, email and password are required", 400);
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError("User with this email already exists", 409);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        phone: phone || null,
        active: active !== undefined ? active : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        active: true,
      },
    });

    logger.info(`Admin created new user: ${newUser.email}`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    next(error);
  }
};

// Export with the new function added
export const userController = {
  getUserProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new ApiError("Authentication required", 401);
      }

      const userData = await userService.getUserProfile(req.userId);

      logger.info(`Retrieved profile for user: ${req.userId}`);

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      logger.error(`Error retrieving user profile: ${error}`);
      next(error);
    }
  },

  updateUserProfile: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.userId) {
        throw new ApiError("Authentication required", 401);
      }

      const { name, phone, avatarUrl } = req.body;

      // Use the service to update the profile
      const userData = await userService.updateUserProfile(req.userId, {
        name,
        phone,
        avatarUrl,
      });

      logger.info(`Updated profile for user: ${req.userId}`);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: userData,
      });
    } catch (error) {
      logger.error(`Error updating user profile: ${error}`);
      next(error);
    }
  },

  uploadAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new ApiError("Authentication required", 401);
      }

      if (!req.file) {
        throw new ApiError("No image provided", 400);
      }

      // Process avatar using the service
      const result = await userService.processAvatar(req.userId, req.file);

      logger.info(`Uploaded avatar for user: ${req.userId}`);

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: result,
      });
    } catch (error) {
      logger.error(`Error uploading avatar: ${error}`);
      next(error);
    }
  },

  getUserFavorites: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new ApiError("Authentication required", 401);
      }

      const properties = await userService.getUserFavorites(req.userId);

      logger.info(
        `Retrieved ${properties.length} favorite properties for user: ${req.userId}`
      );

      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      logger.error(`Error retrieving user favorites: ${error}`);
      next(error);
    }
  },

  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new ApiError("Authentication required", 401);
      }

      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(
        req.userId,
        currentPassword,
        newPassword
      );

      logger.info(`Changed password for user: ${req.userId}`);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error(`Error changing password: ${error}`);
      next(error);
    }
  },

  getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This should be protected by requireAdmin middleware
      const users = await userService.getAllUsers();

      logger.info(`Retrieved ${users.length} users`);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error(`Error retrieving users: ${error}`);
      next(error);
    }
  },

  getUserById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      logger.info(`Retrieved user details for: ${id}`);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error(`Error retrieving user: ${error}`);
      next(error);
    }
  },

  updateUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, role, phone } = req.body;

      const updatedUser = await userService.updateUser(id, {
        name,
        email,
        role,
        phone,
      });

      logger.info(`Updated user: ${id}`);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      logger.error(`Error updating user: ${error}`);
      next(error);
    }
  },

  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await userService.deleteUser(id);

      logger.info(`Deleted user: ${id}`);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error(`Error deleting user: ${error}`);
      next(error);
    }
  },

  createUser, // Add the new function

  getUserNotifications: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.status(200).json({
        success: true,
        data: [], // Return empty array for now
      });
    } catch (error) {
      next(error);
    }
  },

  markNotificationAsRead: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  },

  deleteNotification: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.status(200).json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      next(error);
    }
  },
};
