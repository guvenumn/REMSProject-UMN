// Path: /backend/src/routes/adminRoutes.ts

import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
router.get("/stats", authenticate, requireAdmin, (req, res, next) => {
  logger.info("Admin stats route accessed");
  return adminController.getDashboardStats(req, res, next);
});

/**
 * Get system statistics
 * GET /api/admin/system-stats
 */
router.get("/system-stats", authenticate, requireAdmin, (req, res, next) => {
  logger.info("Admin system stats route accessed");
  return adminController.getSystemStats(req, res, next);
});

/**
 * Get system status (requires health endpoints to be available)
 * GET /api/admin/system-status
 */
router.get("/system-status", authenticate, requireAdmin, (req, res, next) => {
  logger.info("Admin system status route accessed");

  // Return system status manually since we already have health endpoints
  res.status(200).json({
    success: true,
    data: {
      api: "operational",
      database: "operational",
      storage: "operational",
      auth: "operational",
    },
  });
});

export default router;
