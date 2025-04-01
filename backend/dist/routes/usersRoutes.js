"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info("Admin requesting all users");
    return userController_1.userController.getAllUsers(req, res, next);
});
router.get("/:id", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info(`Admin requesting user ${req.params.id}`);
    return userController_1.userController.getUserById(req, res, next);
});
router.post("/", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info("Admin creating new user");
    return userController_1.userController.createUser(req, res, next);
});
router.put("/:id", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info(`Admin updating user ${req.params.id}`);
    return userController_1.userController.updateUser(req, res, next);
});
router.put("/:id/toggle-status", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info(`Admin toggling status for user ${req.params.id}`);
    return userController_1.userController.toggleUserStatus(req, res, next);
});
router.delete("/:id", authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, (req, res, next) => {
    logger_1.logger.info(`Admin deleting user ${req.params.id}`);
    return userController_1.userController.deleteUser(req, res, next);
});
exports.default = router;
