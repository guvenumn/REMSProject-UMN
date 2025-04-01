// Path: /backend/src/routes/healthRoutes.ts

import { Router } from "express";
import { healthController } from "../controllers/healthController";
import { logger } from "../utils/logger";

const router = Router();

/**
 * General API health check
 * GET /health
 */
router.get("/", (req, res, next) => {
  logger.info("Health check request: API");
  return healthController.checkApiHealth(req, res, next);
});

/**
 * Database health check
 * GET /health/database
 */
router.get("/database", (req, res, next) => {
  logger.info("Health check request: Database");
  return healthController.checkDatabaseHealth(req, res, next);
});

/**
 * Storage health check
 * GET /health/storage
 */
router.get("/storage", (req, res, next) => {
  logger.info("Health check request: Storage");
  return healthController.checkStorageHealth(req, res, next);
});

/**
 * Authentication health check
 * GET /health/auth
 */
router.get("/auth", (req, res, next) => {
  logger.info("Health check request: Auth");
  return healthController.checkAuthHealth(req, res, next);
});

export default router;
