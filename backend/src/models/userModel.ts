// src/models/userModel.ts
import prisma from "../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "../config";
import { logger } from "../utils/logger";
import { NotFoundError, ConflictError, AuthError } from "../utils/errors";

/**
 * User model class for encapsulating user-related database operations
 */
export class UserModel {
  /**
   * Register a new user
   */
  static async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: "USER" | "AGENT" | "ADMIN";
  }) {
    try {
      const { email, password, name, phone, role = "USER" } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        password,
        config.auth.bcrypt.saltRounds
      );

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role,
        },
      });

      // Generate auth token
      const token = jwt.sign({ id: user.id }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn,
      });

      // Return user and token (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error(`Error in UserModel.register: ${error}`);
      throw error;
    }
  }

  /**
   * Login a user
   */
  static async login(email: string, password: string) {
    try {// src/middleware/uploadMiddleware.ts
      import multer from "multer";
      import path from "path";
      import fs from "fs";
      import { v4 as uuidv4 } from "uuid";
      import { Request } from "express";
      import config from "../config";
      import { BadRequestError } from "../utils/errors";
      import { logger } from "../utils/logger";
      
      // Ensure upload directories exist
      const ensureDirectoriesExist = () => {
        const directories = [
          config.upload.tempDir,
          config.upload.avatarsDir,
          config.upload.propertiesDir,
          config.upload.documentsDir,
        ];
      
        directories.forEach((dir) => {
          if (!fs.existsSync(dir)) {
            try {
              fs.mkdirSync(dir, { recursive: true });
              logger.info(`Created directory: ${dir}`);
            } catch (error) {
              logger.error(`Failed to create directory ${dir}: ${error}`);
            }
          }
        });
      };
      
      // Create upload directories
      ensureDirectoriesExist();
      
      // Configure storage for different upload types
      const createStorage = (destination: string) => {
        return multer.diskStorage({
          destination: (_req, _file, cb) => {
            cb(null, destination);
          },
          filename: (_req, file, cb) => {
            const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(
              file.originalname
            )}`;
            cb(null, uniqueName);
          },
        });
      };
      
      // File type validators
      const imageFileFilter = (
        req: Request,
        file: MulterFile;,
        callback: multer.FileFilterCallback
      ) => {
        if (!config.upload.allowedImageTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestError(
              `Invalid file type. Only ${config.upload.allowedImageTypes.join(
                ", "
              )} are allowed.`
            )
          );
        }
        callback(null, true);
      };
      
      const documentFileFilter = (
        req: Request,
        file: MulterFile;,
        callback: multer.FileFilterCallback
      ) => {
        if (!config.upload.allowedDocumentTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestError(
              `Invalid file type. Only ${config.upload.allowedDocumentTypes.join(
                ", "
              )} are allowed.`
            )
          );
        }
        callback(null, true);
      };
      
      // Create multer instances for different types of uploads
      export const avatarUpload = multer({
        storage: createStorage(config.upload.avatarsDir),
        limits: {
          fileSize: config.upload.maxFileSize, // 5MB
          files: 1, // Only one avatar at a time
        },
        fileFilter: imageFileFilter,
      });
      
      export const propertyImageUpload = multer({
        storage: createStorage(config.upload.propertiesDir),
        limits: {
          fileSize: config.upload.maxFileSize,
          files: config.upload.maxFiles, // Multiple images allowed
        },
        fileFilter: imageFileFilter,
      });
      
      export const documentUpload = multer({
        storage: createStorage(config.upload.documentsDir),
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB for documents
          files: 5,
        },
        fileFilter: documentFileFilter,
      });
      
      /**
       * Generic upload to temporary directory
       * Useful when you need to process the file before moving it to final location
       */
      export const tempUpload = multer({
        storage: createStorage(config.upload.tempDir),
        limits: {
          fileSize: config.upload.maxFileSize,
          files: 1,
        },
      });
      
      /**
       * Helper to move a file from temp directory to final destination
       */
      export const moveFile = (
        tempFilePath: string,
        destinationDir: string,
        newFilename?: string
      ): string => {
        // Ensure destination directory exists
        if (!fs.existsSync(destinationDir)) {
          fs.mkdirSync(destinationDir, { recursive: true });
        }
      
        // Get original filename if new one not provided
        const filename = newFilename || path.basename(tempFilePath);
        const destinationPath = path.join(destinationDir, filename);
      
        // Move the file
        fs.renameSync(tempFilePath, destinationPath);
      
        return destinationPath;
      };
      
      /**
       * Delete a file
       */
      export const deleteFile = (filePath: string): boolean => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
          }
          return false;
        } catch (error) {
          logger.error(`Failed to delete file ${filePath}: ${error}`);
          return false;
        }
      };
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthError("Invalid credentials");
      }

      // Skip password check in development mode if enabled
      let isPasswordValid = true;
      if (
        process.env.NODE_ENV === "production" ||
        !process.env.SKIP_PASSWORD_CHECK
      ) {
        // Verify password
        isPasswordValid = await bcrypt.compare(password, user.password);
      }

      if (!isPasswordValid) {
        throw new AuthError("Invalid credentials");
      }

      // Generate auth token
      const token = jwt.sign({ id: user.id }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn,
      });

      // Return user and token (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error(`Error in UserModel.login: ${error}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error(`Error in UserModel.getById: ${error}`);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    id: string,
    data: {
      name?: string;
      phone?: string | null;
      avatarUrl?: string | null;
    }
  ) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error(`Error in UserModel.updateProfile: ${error}`);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id },
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
        throw new AuthError("Current password is incorrect");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        config.auth.bcrypt.saltRounds
      );

      // Update password
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
      });

      return true;
    } catch (error) {
      logger.error(`Error in UserModel.changePassword: ${error}`);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't expose whether the email exists for security
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(
        Date.now() + config.auth.resetTokenExpiresIn
      );

      // Save token to user record
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // In a real app, you would send an email with the reset link
      // For this implementation, we just return the token
      return resetToken;
    } catch (error) {
      logger.error(`Error in UserModel.requestPasswordReset: ${error}`);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(resetToken: string, newPassword: string) {
    try {
      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new AuthError("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        config.auth.bcrypt.saltRounds
      );

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return true;
    } catch (error) {
      logger.error(`Error in UserModel.resetPassword: ${error}`);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAll() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return users;
    } catch (error) {
      logger.error(`Error in UserModel.getAll: ${error}`);
      throw error;
    }
  }

  /**
   * Update user (admin only)
   */
  static async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      role?: "USER" | "AGENT" | "ADMIN";
      avatarUrl?: string | null;
    }
  ) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundError("User not found");
      }

      // If email is being changed, check if new email is already taken
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
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      logger.error(`Error in UserModel.update: ${error}`);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  static async delete(id: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Delete user
      await prisma.user.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error(`Error in UserModel.delete: ${error}`);
      throw error;
    }
  }
}

export default UserModel;
