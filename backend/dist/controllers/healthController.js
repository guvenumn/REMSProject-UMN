"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const prisma = new client_1.PrismaClient();
exports.healthController = {
    checkApiHealth: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            logger_1.logger.info("Health check: API");
            res.status(200).json({
                status: "operational",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error(`Error checking API health: ${error}`);
            next(error);
        }
    }),
    checkDatabaseHealth: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            logger_1.logger.info("Health check: Database");
            const result = yield prisma.$queryRaw `SELECT 1 as test`;
            res.status(200).json({
                status: "operational",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error(`Database health check failed: ${error}`);
            res.status(503).json({
                status: "down",
                error: error instanceof Error ? error.message : "Unknown database error",
                timestamp: new Date().toISOString(),
            });
        }
    }),
    checkStorageHealth: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            logger_1.logger.info("Health check: Storage");
            const dirs = [
                config_1.default.upload.baseDir,
                config_1.default.upload.avatarsDir,
                config_1.default.upload.propertiesDir,
                config_1.default.upload.documentsDir,
            ];
            for (const dir of dirs) {
                if (!fs_1.default.existsSync(dir)) {
                    fs_1.default.mkdirSync(dir, { recursive: true });
                }
            }
            const testFile = path_1.default.join(config_1.default.upload.baseDir, ".health-check");
            fs_1.default.writeFileSync(testFile, "test");
            fs_1.default.unlinkSync(testFile);
            res.status(200).json({
                status: "operational",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error(`Storage health check failed: ${error}`);
            res.status(503).json({
                status: "down",
                error: error instanceof Error ? error.message : "Unknown storage error",
                timestamp: new Date().toISOString(),
            });
        }
    }),
    checkAuthHealth: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            logger_1.logger.info("Health check: Authentication");
            const testToken = jsonwebtoken_1.default.sign({ test: true }, config_1.default.auth.jwtSecret, {
                expiresIn: "10s",
            });
            const verified = jsonwebtoken_1.default.verify(testToken, config_1.default.auth.jwtSecret);
            if (!verified) {
                throw new Error("JWT verification failed");
            }
            res.status(200).json({
                status: "operational",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error(`Auth health check failed: ${error}`);
            res.status(503).json({
                status: "down",
                error: error instanceof Error ? error.message : "Unknown auth error",
                timestamp: new Date().toISOString(),
            });
        }
    }),
};
exports.default = exports.healthController;
