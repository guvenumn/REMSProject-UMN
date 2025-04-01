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
exports.requireAgent = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
let prisma;
try {
    prisma = new client_1.PrismaClient();
}
catch (error) {
    console.error("Failed to initialize Prisma client:", error);
    prisma = null;
}
const getPrismaClient = () => {
    if (!prisma) {
        try {
            prisma = new client_1.PrismaClient();
        }
        catch (error) {
            console.error("Failed to initialize Prisma client:", error);
            throw new errors_1.ApiError("Database connection error", 500);
        }
    }
    return prisma;
};
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        logger_1.logger.info("Token received, verifying...");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
        logger_1.logger.info(`Token verified for user ID: ${decoded.id}`);
        req.userId = decoded.id;
        const user = yield getPrismaClient().user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        if (!user) {
            throw new errors_1.ApiError("User not found", 401);
        }
        req.user = user;
        req.userRole = user.role;
        logger_1.logger.info(`User authenticated: ${user.email}`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new errors_1.ApiError("Invalid token", 401));
        }
        next(error);
    }
});
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.userRole !== "ADMIN") {
        return next(new errors_1.ApiError("Admin privileges required", 403));
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireAgent = (req, res, next) => {
    if (!req.user || (req.userRole !== "AGENT" && req.userRole !== "ADMIN")) {
        return next(new errors_1.ApiError("Agent privileges required", 403));
    }
    next();
};
exports.requireAgent = requireAgent;
