// Path: /backend/src/routes/usersRoutes.ts

import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get all users (admin only)
 * GET /api/users
 */
router.get("/", authenticate, requireAdmin, (req, res, next) => {
  logger.info("Admin requesting all users");
  return userController.getAllUsers(req, res, next);
});

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
router.get("/:id", authenticate, requireAdmin, (req, res, next) => {
  logger.info(`Admin requesting user ${req.params.id}`);
  return userController.getUserById(req, res, next);
});

/**
 * Create a new user (admin only)
 * POST /api/users
 */
router.post("/", authenticate, requireAdmin, (req, res, next) => {
  logger.info("Admin creating new user");
  return userController.createUser(req, res, next);
});

/**
 * Update user (admin only)
 * PUT /api/users/:id
 */
router.put("/:id", authenticate, requireAdmin, (req, res, next) => {
  logger.info(`Admin updating user ${req.params.id}`);
  return userController.updateUser(req, res, next);
});

/**
 * Toggle user status (enable/disable - admin only)
 * PUT /api/users/:id/toggle-status
 */
router.put(
  "/:id/toggle-status",
  authenticate,
  requireAdmin,
  (req, res, next) => {
    logger.info(`Admin toggling status for user ${req.params.id}`);
    return userController.toggleUserStatus(req, res, next);
  }
);

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
router.delete("/:id", authenticate, requireAdmin, (req, res, next) => {
  logger.info(`Admin deleting user ${req.params.id}`);
  return userController.deleteUser(req, res, next);
});

export default router;
