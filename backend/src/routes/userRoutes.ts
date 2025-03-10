// file: /var/www/rems/backend/src/routes/userRoutes.ts

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import config from "../config";
import { logger } from "../utils/logger";

const router = Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = config.upload.avatarsDir;

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `image-${Date.now()}-${Math.floor(
      Math.random() * 1000000000
    )}${ext}`;
    cb(null, filename);
  },
});

// File filter for avatar uploads
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only image files
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Only the following image types are allowed: ${allowedMimeTypes.join(
          ", "
        )}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Get user profile
 * GET /api/user/profile
 */
router.get("/profile", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} requesting profile`);
  return userController.getUserProfile(req, res, next);
});

/**
 * Update user profile
 * PUT /api/user/profile
 */
router.put("/profile", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} updating profile`);
  return userController.updateUserProfile(req, res, next);
});

/**
 * Upload user avatar
 * POST /api/user/avatar
 */
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  (req, res, next) => {
    logger.info(`User ${req.userId} uploading avatar`);
    return userController.uploadAvatar(req as any, res, next);
  }
);

/**
 * Get user favorites
 * GET /api/user/favorites
 */
router.get("/favorites", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} requesting favorites`);
  return userController.getUserFavorites(req, res, next);
});

/**
 * Change user password
 * POST /api/user/change-password
 */
router.post("/change-password", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} changing password`);
  return userController.changePassword(req, res, next);
});

/**
 * Get user notifications
 * GET /api/user/notifications
 */
router.get("/notifications", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} requesting notifications`);
  return userController.getUserNotifications(req, res, next);
});

/**
 * Mark notification as read
 * PUT /api/user/notifications/:id
 */
router.put("/notifications/:id", authenticate, (req, res, next) => {
  logger.info(
    `User ${req.userId} marking notification ${req.params.id} as read`
  );
  return userController.markNotificationAsRead(req, res, next);
});

/**
 * Delete notification
 * DELETE /api/user/notifications/:id
 */
router.delete("/notifications/:id", authenticate, (req, res, next) => {
  logger.info(`User ${req.userId} deleting notification ${req.params.id}`);
  return userController.deleteNotification(req, res, next);
});

export default router;
