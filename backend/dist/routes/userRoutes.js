"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = config_1.default.upload.avatarsDir;
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `image-${Date.now()}-${Math.floor(Math.random() * 1000000000)}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Only the following image types are allowed: ${allowedMimeTypes.join(", ")}`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.get("/profile", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} requesting profile`);
    return userController_1.userController.getUserProfile(req, res, next);
});
router.put("/profile", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} updating profile`);
    return userController_1.userController.updateUserProfile(req, res, next);
});
router.post("/avatar", authMiddleware_1.authenticate, upload.single("avatar"), (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} uploading avatar`);
    return userController_1.userController.uploadAvatar(req, res, next);
});
router.get("/favorites", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} requesting favorites`);
    return userController_1.userController.getUserFavorites(req, res, next);
});
router.post("/change-password", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} changing password`);
    return userController_1.userController.changePassword(req, res, next);
});
router.get("/notifications", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} requesting notifications`);
    return userController_1.userController.getUserNotifications(req, res, next);
});
router.put("/notifications/:id", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} marking notification ${req.params.id} as read`);
    return userController_1.userController.markNotificationAsRead(req, res, next);
});
router.delete("/notifications/:id", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info(`User ${req.userId} deleting notification ${req.params.id}`);
    return userController_1.userController.deleteNotification(req, res, next);
});
exports.default = router;
