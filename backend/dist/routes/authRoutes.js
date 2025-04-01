"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post("/login", (req, res, next) => {
    logger_1.logger.info("Auth login route accessed");
    (0, authController_1.login)(req, res, next);
});
router.post("/register", (req, res, next) => {
    logger_1.logger.info("Auth register route accessed");
    (0, authController_1.register)(req, res, next);
});
router.post("/logout", (req, res, next) => {
    logger_1.logger.info("Auth logout route accessed");
    (0, authController_1.logout)(req, res, next);
});
router.get("/me", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info("Auth me route accessed");
    (0, authController_1.getCurrentUser)(req, res, next);
});
router.post("/change-password", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info("Change password route accessed");
    (0, authController_1.updatePassword)(req, res, next);
});
exports.default = router;
