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
exports.logout = exports.updatePassword = exports.getCurrentUser = exports.register = exports.login = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        logger_1.logger.info(`Login attempt for user: ${email}`);
        console.log(`Login attempt for user: ${email}`);
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: "Please provide email and password",
            });
            return;
        }
        const user = yield getPrismaClient()
            .user.findUnique({
            where: { email },
        })
            .catch((err) => {
            logger_1.logger.error(`Database error while finding user: ${err.message}`);
            throw new errors_1.ApiError("Database error occurred", 500);
        });
        if (!user) {
            logger_1.logger.info(`User not found for email: ${email}`);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default
            .compare(password, user.password)
            .catch((err) => {
            logger_1.logger.error(`Error comparing passwords: ${err.message}`);
            throw new errors_1.ApiError("Authentication error", 500);
        });
        if (!isPasswordValid) {
            logger_1.logger.info(`Invalid password for user: ${email}`);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";
        const jwtExpiresIn = "7d";
        const token = jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, {
            expiresIn: jwtExpiresIn,
        });
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        logger_1.logger.info(`Login successful for user: ${email}`);
        console.log(`Login successful for user: ${email}`);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: userResponse,
                token,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Login error: ${error}`);
        console.error(`Login error:`, error);
        next(error);
    }
});
exports.login = login;
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        logger_1.logger.info(`Registration attempt for user: ${email}`);
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                error: "Please provide name, email, and password",
            });
            return;
        }
        const existingUser = yield getPrismaClient()
            .user.findUnique({
            where: { email },
        })
            .catch((err) => {
            logger_1.logger.error(`Database error while checking existing user: ${err.message}`);
            throw new errors_1.ApiError("Database error occurred", 500);
        });
        if (existingUser) {
            logger_1.logger.info(`User already exists with email: ${email}`);
            res.status(400).json({
                success: false,
                error: "Email already in use",
            });
            return;
        }
        const hashedPassword = yield bcrypt_1.default
            .hash(password, 10)
            .catch((err) => {
            logger_1.logger.error(`Error hashing password: ${err.message}`);
            throw new errors_1.ApiError("Error creating user", 500);
        });
        const user = yield getPrismaClient()
            .user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
            },
        })
            .catch((err) => {
            logger_1.logger.error(`Database error while creating user: ${err.message}`);
            throw new errors_1.ApiError("Error creating user", 500);
        });
        const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";
        const jwtExpiresIn = "7d";
        const token = jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, {
            expiresIn: jwtExpiresIn,
        });
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        logger_1.logger.info(`Registration successful for user: ${email}`);
        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: userResponse,
                token,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Registration error: ${error}`);
        next(error);
    }
});
exports.register = register;
const getCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
            return;
        }
        const user = yield getPrismaClient()
            .user.findUnique({
            where: { id: req.userId },
        })
            .catch((err) => {
            logger_1.logger.error(`Database error while getting current user: ${err.message}`);
            throw new errors_1.ApiError("Database error occurred", 500);
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        logger_1.logger.info(`Retrieved current user data for: ${req.userId}`);
        res.status(200).json({
            success: true,
            data: userResponse,
        });
    }
    catch (error) {
        logger_1.logger.error(`Get current user error: ${error}`);
        next(error);
    }
});
exports.getCurrentUser = getCurrentUser;
const updatePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        logger_1.logger.info(`Password update requested for user ${userId}`);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
            return;
        }
        const user = yield getPrismaClient().user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            logger_1.logger.warn(`User not found for password update: ${userId}`);
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            logger_1.logger.warn(`Invalid current password provided for user: ${userId}`);
            res.status(401).json({
                success: false,
                message: "incorrect_password",
            });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield getPrismaClient().user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        logger_1.logger.info(`Password successfully updated for user: ${userId}`);
        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Error in updatePassword:", error);
        next(error);
    }
});
exports.updatePassword = updatePassword;
const logout = (req, res, next) => {
    try {
        logger_1.logger.info("Logout attempt");
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        logger_1.logger.error(`Logout error: ${error}`);
        next(error);
    }
};
exports.logout = logout;
