"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.authenticate, (req, res, next) => {
    logger_1.logger.info("Accessing own profile");
    return userController_1.userController.getUserProfile(req, res, next);
});
router.put("/", authMiddleware_1.authenticate, (0, validation_1.validate)(validation_1.schemas.userProfileUpdate), (req, res, next) => {
    logger_1.logger.info("Updating own profile");
    return userController_1.userController.updateUserProfile(req, res, next);
});
exports.default = router;
