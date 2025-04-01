// Path: /backend/src/controllers/adminController.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export const adminController = {
  /**
   * Get dashboard statistics for admin
   */
  getDashboardStats: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Check if user is admin
      if (!req.user || req.userRole !== "ADMIN") {
        throw new ApiError("Admin privileges required", 403);
      }

      logger.info("Admin dashboard stats requested");

      // Get counts in parallel for efficiency
      const [totalUsers, totalAgents, totalProperties, activeListings] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: "AGENT" } }),
          prisma.property.count(),
          prisma.property.count({ where: { status: "AVAILABLE" } }),
        ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalAgents,
          totalProperties,
          activeListings,
        },
      });
    } catch (error) {
      logger.error(`Error getting admin dashboard stats: ${error}`);
      next(error);
    }
  },

  /**
   * Get system statistics and server info
   */
  getSystemStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is admin
      if (!req.user || req.userRole !== "ADMIN") {
        throw new ApiError("Admin privileges required", 403);
      }

      logger.info("Admin system stats requested");

      // Get counts for various models
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.savedProperty.count(),
        prisma.propertyInquiry.count(),
      ]);

      const stats = {
        models: {
          users: counts[0],
          properties: counts[1],
          conversations: counts[2],
          messages: counts[3],
          savedProperties: counts[4],
          inquiries: counts[5],
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error(`Error getting system stats: ${error}`);
      next(error);
    }
  },
};

export default adminController;
