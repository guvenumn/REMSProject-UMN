"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get("/stats", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info("Admin stats route accessed");
    return adminController_1.adminController.getDashboardStats(req, res, next);
});
router.get("/system-stats", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info("Admin system stats route accessed");
    return adminController_1.adminController.getSystemStats(req, res, next);
});
router.get("/system-status", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info("Admin system status route accessed");
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
exports.default = router;
