// src/services/authService.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config";
import { BadRequestError, AuthError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Authenticate a user with email and password
 */
export const authenticate = async (email: string, password: string) => {
  logger.info(`Authentication attempt for email: ${email}`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn(`Authentication failed: User not found for email: ${email}`);
    throw new AuthError("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn(`Authentication failed: Invalid password for email: ${email}`);
    throw new AuthError("Invalid email or password");
  }

  logger.info(`Authentication successful for user: ${user.id}`);

  // Generate JWT token
  const token = generateToken(user.id);

  // Return user data and token
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
};

/**
 * Register a new user
 */
export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  logger.info(`Registration attempt for email: ${userData.email}`);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    logger.warn(`Registration failed: Email already in use: ${userData.email}`);
    throw new BadRequestError("Email is already in use");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "USER",
    },
  });

  logger.info(`User registered successfully: ${newUser.id}`);

  // Generate JWT token
  const token = generateToken(newUser.id);

  // Return user data and token
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    },
    token,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  logger.info(`Fetching user by ID: ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.warn(`User not found: ${userId}`);
    throw new NotFoundError("User not found");
  }

  logger.info(`User found: ${userId}`);

  // Return user data without password
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string) => {
  logger.info(`Generating token for user: ${userId}`);

  return jwt.sign({ id: userId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    logger.info(`Token verified successfully`);
    return decoded;
  } catch (error) {
    logger.warn(`Token verification failed: ${error}`);
    throw new AuthError("Invalid or expired token");
  }
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = async (email: string) => {
  logger.info(`Generating password reset token for email: ${email}`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn(`Password reset failed: User not found for email: ${email}`);
    throw new NotFoundError("User not found");
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Save reset token to user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  logger.info(`Password reset token generated for user: ${user.id}`);

  return resetToken;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string) => {
  logger.info(`Resetting password with token`);

  // Find user by reset token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    logger.warn(`Password reset failed: Invalid or expired token`);
    throw new BadRequestError("Invalid or expired reset token");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  logger.info(`Password reset successful for user: ${user.id}`);

  return true;
};

/**
 * Change password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  logger.info(`Password change attempt for user: ${userId}`);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.warn(`Password change failed: User not found: ${userId}`);
    throw new NotFoundError("User not found");
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    logger.warn(
      `Password change failed: Invalid current password for user: ${userId}`
    );
    throw new BadRequestError("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  logger.info(`Password changed successfully for user: ${userId}`);

  return true;
};
