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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const prisma = new client_1.PrismaClient();
exports.userService = {
    getUserById: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Getting user by ID: ${userId}`);
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        return user;
    }),
    getUserProfile: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Getting profile for user: ${userId}`);
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        const savedCount = yield prisma.savedProperty.count({
            where: { userId },
        });
        const inquiriesCount = yield prisma.propertyInquiry.count({
            where: { userId },
        });
        const { password } = user, userData = __rest(user, ["password"]);
        return Object.assign(Object.assign({}, userData), { stats: {
                savedProperties: savedCount,
                inquiries: inquiriesCount,
            } });
    }),
    updateUserProfile: (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Updating profile for user: ${userId}`);
        if (data.name !== undefined && (!data.name || data.name.trim() === "")) {
            throw new errors_1.BadRequestError("Name is required");
        }
        try {
            const updatedUser = yield prisma.user.update({
                where: { id: userId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    avatarUrl: data.avatarUrl,
                },
            });
            const { password } = updatedUser, userData = __rest(updatedUser, ["password"]);
            return userData;
        }
        catch (error) {
            logger_1.logger.error(`[userService] Error updating user profile: ${error}`);
            throw new errors_1.ApiError("Failed to update user profile", 500);
        }
    }),
    processAvatar: (userId, file) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Processing avatar for user: ${userId}`);
        if (!file) {
            throw new errors_1.BadRequestError("No image provided");
        }
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        try {
            if (user.avatarUrl &&
                !user.avatarUrl.includes("default") &&
                fs_1.default.existsSync(path_1.default.join(config_1.default.upload.avatarsDir, path_1.default.basename(user.avatarUrl)))) {
                fs_1.default.unlinkSync(path_1.default.join(config_1.default.upload.avatarsDir, path_1.default.basename(user.avatarUrl)));
            }
            const avatarUrl = `/uploads/avatars/${file.filename}`;
            yield prisma.user.update({
                where: { id: userId },
                data: { avatarUrl },
            });
            return { avatarUrl };
        }
        catch (error) {
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            logger_1.logger.error(`[userService] Error processing avatar: ${error}`);
            throw new errors_1.ApiError("Failed to process avatar", 500);
        }
    }),
    getUserFavorites: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Getting favorites for user: ${userId}`);
        const savedProperties = yield prisma.savedProperty.findMany({
            where: { userId },
            select: { propertyId: true },
        });
        const properties = yield prisma.property.findMany({
            where: {
                id: { in: savedProperties.map((sp) => sp.propertyId) },
            },
            include: {
                images: {
                    take: 1,
                    orderBy: { orderIndex: "asc" },
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return properties;
    }),
    changePassword: (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Changing password for user: ${userId}`);
        if (!currentPassword || !newPassword) {
            throw new errors_1.BadRequestError("Current password and new password are required");
        }
        if (newPassword.length < 6) {
            throw new errors_1.BadRequestError("New password must be at least 6 characters");
        }
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new errors_1.BadRequestError("Current password is incorrect");
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return true;
    }),
    getAllUsers: () => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Getting all users`);
        return yield prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                phone: true,
                active: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }),
    updateUser: (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Admin updating user: ${userId}`);
        const existingUser = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new errors_1.NotFoundError("User not found");
        }
        if (data.email && data.email !== existingUser.email) {
            const emailExists = yield prisma.user.findUnique({
                where: { email: data.email },
            });
            if (emailExists) {
                throw new errors_1.ConflictError("Email already in use");
            }
        }
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                phone: true,
                active: true,
            },
        });
        return updatedUser;
    }),
    updateUserStatus: (userId, active) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Admin toggling user status: ${userId} to ${active ? "active" : "inactive"}`);
        const existingUser = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new errors_1.NotFoundError("User not found");
        }
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: { active },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                phone: true,
                active: true,
            },
        });
        return updatedUser;
    }),
    deleteUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`[userService] Admin deleting user: ${userId}`);
        const existingUser = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new errors_1.NotFoundError("User not found");
        }
        yield prisma.user.delete({
            where: { id: userId },
        });
        return true;
    }),
};
exports.default = exports.userService;
