// Path: /backend/src/controllers/healthController.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import config from "../config";

const prisma = new PrismaClient();

export const healthController = {
  /**
   * Check overall API health
   */
  checkApiHealth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Health check: API");

      // The API is clearly operational if this code is running
      res.status(200).json({
        status: "operational",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error checking API health: ${error}`);
      next(error);
    }
  },

  /**
   * Check database health
   */
  checkDatabaseHealth: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info("Health check: Database");

      // Test database connection with a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;

      // If we get here, the database is working
      res.status(200).json({
        status: "operational",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Database health check failed: ${error}`);

      // Return degraded status instead of throwing an error
      res.status(503).json({
        status: "down",
        error:
          error instanceof Error ? error.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Check storage service health
   */
  checkStorageHealth: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info("Health check: Storage");

      // Check if uploads directories exist
      const dirs = [
        config.upload.baseDir,
        config.upload.avatarsDir,
        config.upload.propertiesDir,
        config.upload.documentsDir,
      ];

      // Create directories if they don't exist
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      // Check if we can write to the uploads directory
      const testFile = path.join(config.upload.baseDir, ".health-check");

      // Try to write and then delete a test file
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);

      res.status(200).json({
        status: "operational",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Storage health check failed: ${error}`);

      // Return degraded status
      res.status(503).json({
        status: "down",
        error: error instanceof Error ? error.message : "Unknown storage error",
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Check authentication service health
   */
  checkAuthHealth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Health check: Authentication");

      // Try to create and verify a JWT token
      const testToken = jwt.sign({ test: true }, config.auth.jwtSecret, {
        expiresIn: "10s",
      });

      // Verify the token
      const verified = jwt.verify(testToken, config.auth.jwtSecret);

      if (!verified) {
        throw new Error("JWT verification failed");
      }

      res.status(200).json({
        status: "operational",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Auth health check failed: ${error}`);

      // Return degraded status
      res.status(503).json({
        status: "down",
        error: error instanceof Error ? error.message : "Unknown auth error",
        timestamp: new Date().toISOString(),
      });
    }
  },
};

export default healthController;
