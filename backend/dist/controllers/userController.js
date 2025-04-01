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
exports.userController = void 0;
const userService_1 = require("../services/userService");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.userController = {
    getUserProfile: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                throw new errors_1.ApiError("Authentication required", 401);
            }
            const userData = yield userService_1.userService.getUserProfile(req.userId);
            logger_1.logger.info(`Retrieved profile for user: ${req.userId}`);
            res.status(200).json({
                success: true,
                data: userData,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving user profile: ${error}`);
            next(error);
        }
    }),
    updateUserProfile: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                throw new errors_1.ApiError("Authentication required", 401);
            }
            const { name, phone, avatarUrl } = req.body;
            const userData = yield userService_1.userService.updateUserProfile(req.userId, {
                name,
                phone,
                avatarUrl,
            });
            logger_1.logger.info(`Updated profile for user: ${req.userId}`);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: userData,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error updating user profile: ${error}`);
            next(error);
        }
    }),
    uploadAvatar: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                throw new errors_1.ApiError("Authentication required", 401);
            }
            if (!req.file) {
                throw new errors_1.ApiError("No image provided", 400);
            }
            logger_1.logger.info(`Processing avatar upload for user: ${req.userId}, file: ${req.file.filename}`);
            const result = yield userService_1.userService.processAvatar(req.userId, req.file);
            res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                file: {
                    originalname: req.file.originalname,
                    filename: req.file.filename,
                    path: result.avatarUrl,
                    size: req.file.size,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error uploading avatar: ${error}`);
            next(error);
        }
    }),
    getUserFavorites: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                throw new errors_1.ApiError("Authentication required", 401);
            }
            const properties = yield userService_1.userService.getUserFavorites(req.userId);
            logger_1.logger.info(`Retrieved ${properties.length} favorite properties for user: ${req.userId}`);
            res.status(200).json({
                success: true,
                data: properties,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving user favorites: ${error}`);
            next(error);
        }
    }),
    changePassword: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                throw new errors_1.ApiError("Authentication required", 401);
            }
            const { currentPassword, newPassword } = req.body;
            yield userService_1.userService.changePassword(req.userId, currentPassword, newPassword);
            logger_1.logger.info(`Changed password for user: ${req.userId}`);
            res.status(200).json({
                success: true,
                message: "Password changed successfully",
            });
        }
        catch (error) {
            logger_1.logger.error(`Error changing password: ${error}`);
            next(error);
        }
    }),
    getAllUsers: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const users = yield userService_1.userService.getAllUsers();
            logger_1.logger.info(`Retrieved ${users.length} users`);
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving users: ${error}`);
            next(error);
        }
    }),
    getUserById: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const user = yield userService_1.userService.getUserById(id);
            logger_1.logger.info(`Retrieved user details for: ${id}`);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving user: ${error}`);
            next(error);
        }
    }),
    updateUser: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { name, email, role, phone } = req.body;
            const updatedUser = yield userService_1.userService.updateUser(id, {
                name,
                email,
                role,
                phone,
            });
            logger_1.logger.info(`Updated user: ${id}`);
            res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error updating user: ${error}`);
            next(error);
        }
    }),
    toggleUserStatus: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user || req.userRole !== "ADMIN") {
                throw new errors_1.ApiError("Admin privileges required", 403);
            }
            const { id } = req.params;
            const { active } = req.body;
            if (active === undefined) {
                throw new errors_1.ApiError("Active status is required", 400);
            }
            if (id === req.userId && active === false) {
                throw new errors_1.ApiError("You cannot disable your own account idiot", 400);
            }
            const updatedUser = yield userService_1.userService.updateUserStatus(id, active);
            logger_1.logger.info(`Admin ${req.userId} toggled status for user ${id} to ${active ? "active" : "inactive"}`);
            res.status(200).json({
                success: true,
                message: `User ${active ? "enabled" : "disabled"} successfully`,
                data: updatedUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error toggling user status: ${error}`);
            next(error);
        }
    }),
    deleteUser: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            yield userService_1.userService.deleteUser(id);
            logger_1.logger.info(`Deleted user: ${id}`);
            res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting user: ${error}`);
            next(error);
        }
    }),
    createUser: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user || req.userRole !== "ADMIN") {
                throw new errors_1.ApiError("Admin privileges required", 403);
            }
            const { name, email, password, role, phone, active } = req.body;
            if (!name || !email || !password) {
                throw new errors_1.ApiError("Name, email and password are required", 400);
            }
            const existingUser = yield prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                throw new errors_1.ApiError("User with this email already exists", 409);
            }
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
            const newUser = yield prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role || "USER",
                    phone: phone || null,
                    active: active !== undefined ? active : true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    active: true,
                },
            });
            logger_1.logger.info(`Admin created new user: ${newUser.email}`);
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: newUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating user: ${error}`);
            next(error);
        }
    }),
    getUserNotifications: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            res.status(200).json({
                success: true,
                data: [],
            });
        }
        catch (error) {
            next(error);
        }
    }),
    markNotificationAsRead: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            res.status(200).json({
                success: true,
                message: "Notification marked as read",
            });
        }
        catch (error) {
            next(error);
        }
    }),
    deleteNotification: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            res.status(200).json({
                success: true,
                message: "Notification deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }),
};
