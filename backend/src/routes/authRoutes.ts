// file: /var/www/rems/backend/src/routes/authRoutes.ts

import { Router } from "express";
import {
  login,
  logout,
  getCurrentUser,
  register,
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * User login
 * POST /api/auth/login
 */
router.post("/login", (req, res, next) => {
  logger.info("Auth login route accessed");
  login(req, res, next);
});

/**
 * User registration
 * POST /api/auth/register
 */
router.post("/register", (req, res, next) => {
  logger.info("Auth register route accessed");
  register(req, res, next);
});

/**
 * User logout
 * POST /api/auth/logout
 */
router.post("/logout", (req, res, next) => {
  logger.info("Auth logout route accessed");
  logout(req, res, next);
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get("/me", authenticate, (req, res, next) => {
  logger.info("Auth me route accessed");
  getCurrentUser(req, res, next);
});

export default router;
