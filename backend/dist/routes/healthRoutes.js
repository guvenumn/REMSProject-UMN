"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get("/", (req, res, next) => {
    logger_1.logger.info("Health check request: API");
    return healthController_1.healthController.checkApiHealth(req, res, next);
});
router.get("/database", (req, res, next) => {
    logger_1.logger.info("Health check request: Database");
    return healthController_1.healthController.checkDatabaseHealth(req, res, next);
});
router.get("/storage", (req, res, next) => {
    logger_1.logger.info("Health check request: Storage");
    return healthController_1.healthController.checkStorageHealth(req, res, next);
});
router.get("/auth", (req, res, next) => {
    logger_1.logger.info("Health check request: Auth");
    return healthController_1.healthController.checkAuthHealth(req, res, next);
});
exports.default = router;
