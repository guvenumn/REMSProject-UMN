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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
exports.adminController = {
    getDashboardStats: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user || req.userRole !== "ADMIN") {
                throw new errors_1.ApiError("Admin privileges required", 403);
            }
            logger_1.logger.info("Admin dashboard stats requested");
            const [totalUsers, totalAgents, totalProperties, activeListings] = yield Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { role: "AGENT" } }),
                prisma.property.count(),
                prisma.property.count({ where: { status: "AVAILABLE" } }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalAgents,
                    totalProperties,
                    activeListings,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting admin dashboard stats: ${error}`);
            next(error);
        }
    }),
    getSystemStats: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user || req.userRole !== "ADMIN") {
                throw new errors_1.ApiError("Admin privileges required", 403);
            }
            logger_1.logger.info("Admin system stats requested");
            const counts = yield Promise.all([
                prisma.user.count(),
                prisma.property.count(),
                prisma.conversation.count(),
                prisma.message.count(),
                prisma.savedProperty.count(),
                prisma.propertyInquiry.count(),
            ]);
            const stats = {
                models: {
                    users: counts[0],
                    properties: counts[1],
                    conversations: counts[2],
                    messages: counts[3],
                    savedProperties: counts[4],
                    inquiries: counts[5],
                },
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                    platform: process.platform,
                },
            };
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting system stats: ${error}`);
            next(error);
        }
    }),
};
exports.default = exports.adminController;
