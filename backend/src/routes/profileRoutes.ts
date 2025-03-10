// file: /backend/src/routes/profileRoutes.ts

import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { validate, schemas } from "../utils/validation";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Get current user profile
 * GET /api/profile
 */
router.get("/", authenticate, (req, res, next) => {
  logger.info("Accessing own profile");
  return userController.getUserProfile(req, res, next);
});

/**
 * Update current user profile
 * PUT /api/profile
 */
router.put(
  "/",
  authenticate,
  validate(schemas.userProfileUpdate),
  (req, res, next) => {
    logger.info("Updating own profile");
    return userController.updateUserProfile(req, res, next);
  }
);

export default router;
