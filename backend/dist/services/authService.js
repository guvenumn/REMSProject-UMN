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
exports.register = exports.authenticate = exports.changePassword = exports.resetPassword = exports.generatePasswordResetToken = exports.verifyToken = exports.generateToken = exports.getUserById = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
function authenticateImpl(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Authentication attempt for email: ${email}`);
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            logger_1.logger.warn(`Authentication failed: User not found for email: ${email}`);
            throw new errors_1.AuthError("Invalid email or password");
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            logger_1.logger.warn(`Authentication failed: Invalid password for email: ${email}`);
            throw new errors_1.AuthError("Invalid email or password");
        }
        logger_1.logger.info(`Authentication successful for user: ${user.id}`);
        const token = (0, exports.generateToken)(user.id);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
    });
}
function registerImpl(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Registration attempt for email: ${userData.email}`);
        const existingUser = yield prisma.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            logger_1.logger.warn(`Registration failed: Email already in use: ${userData.email}`);
            throw new errors_1.BadRequestError("Email is already in use");
        }
        const hashedPassword = yield bcrypt_1.default.hash(userData.password, 10);
        const newUser = yield prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || "USER",
            },
        });
        logger_1.logger.info(`User registered successfully: ${newUser.id}`);
        const token = (0, exports.generateToken)(newUser.id);
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                phone: newUser.phone,
                avatarUrl: newUser.avatarUrl,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            },
            token,
        };
    });
}
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Fetching user by ID: ${userId}`);
    const user = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        logger_1.logger.warn(`User not found: ${userId}`);
        throw new errors_1.NotFoundError("User not found");
    }
    logger_1.logger.info(`User found: ${userId}`);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
});
exports.getUserById = getUserById;
const generateToken = (userId) => {
    logger_1.logger.info(`Generating token for user: ${userId}`);
    const options = {
        expiresIn: config_1.default.auth.jwtExpiresIn,
    };
    return jsonwebtoken_1.default.sign({ id: userId }, config_1.default.auth.jwtSecret, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
        logger_1.logger.info(`Token verified successfully`);
        return decoded;
    }
    catch (error) {
        logger_1.logger.warn(`Token verification failed: ${error}`);
        throw new errors_1.AuthError("Invalid or expired token");
    }
};
exports.verifyToken = verifyToken;
const generatePasswordResetToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Generating password reset token for email: ${email}`);
    const user = yield prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        logger_1.logger.warn(`Password reset failed: User not found for email: ${email}`);
        throw new errors_1.NotFoundError("User not found");
    }
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpiry,
        },
    });
    logger_1.logger.info(`Password reset token generated for user: ${user.id}`);
    return resetToken;
});
exports.generatePasswordResetToken = generatePasswordResetToken;
const resetPassword = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Resetting password with token`);
    const user = yield prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date(),
            },
        },
    });
    if (!user) {
        logger_1.logger.warn(`Password reset failed: Invalid or expired token`);
        throw new errors_1.BadRequestError("Invalid or expired reset token");
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
    logger_1.logger.info(`Password reset successful for user: ${user.id}`);
    return true;
});
exports.resetPassword = resetPassword;
const changePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Password change attempt for user: ${userId}`);
    const user = yield prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        logger_1.logger.warn(`Password change failed: User not found: ${userId}`);
        throw new errors_1.NotFoundError("User not found");
    }
    const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        logger_1.logger.warn(`Password change failed: Invalid current password for user: ${userId}`);
        throw new errors_1.BadRequestError("Current password is incorrect");
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
    yield prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
    logger_1.logger.info(`Password changed successfully for user: ${userId}`);
    return true;
});
exports.changePassword = changePassword;
exports.authenticate = authenticateImpl;
exports.register = registerImpl;
