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
exports.UserModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class UserModel {
    static register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, name, phone, role = "USER" } = userData;
                const existingUser = yield database_1.default.user.findUnique({
                    where: { email },
                });
                if (existingUser) {
                    throw new errors_1.ConflictError("User with this email already exists");
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, config_1.default.auth.bcrypt.saltRounds);
                const user = yield database_1.default.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        name,
                        phone,
                        role,
                    },
                });
                const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.default.auth.jwtSecret, {
                    expiresIn: config_1.default.auth.jwtExpiresIn,
                });
                const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
                return {
                    user: userWithoutPassword,
                    token,
                };
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.register: ${error}`);
                throw error;
            }
        });
    }
    static login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    throw new errors_1.AuthError("Invalid credentials");
                }
                let isPasswordValid = true;
                if (process.env.NODE_ENV === "production" ||
                    !process.env.SKIP_PASSWORD_CHECK) {
                    isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                }
                if (!isPasswordValid) {
                    throw new errors_1.AuthError("Invalid credentials");
                }
                const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.default.auth.jwtSecret, {
                    expiresIn: config_1.default.auth.jwtExpiresIn,
                });
                const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
                return {
                    user: userWithoutPassword,
                    token,
                };
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.login: ${error}`);
                throw error;
            }
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findUnique({
                    where: { id },
                });
                if (!user) {
                    throw new errors_1.NotFoundError("User not found");
                }
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                return userWithoutPassword;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.getById: ${error}`);
                throw error;
            }
        });
    }
    static updateProfile(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.update({
                    where: { id },
                    data,
                });
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                return userWithoutPassword;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.updateProfile: ${error}`);
                throw error;
            }
        });
    }
    static changePassword(id, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findUnique({
                    where: { id },
                });
                if (!user) {
                    throw new errors_1.NotFoundError("User not found");
                }
                const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
                if (!isPasswordValid) {
                    throw new errors_1.AuthError("Current password is incorrect");
                }
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, config_1.default.auth.bcrypt.saltRounds);
                yield database_1.default.user.update({
                    where: { id },
                    data: {
                        password: hashedPassword,
                    },
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.changePassword: ${error}`);
                throw error;
            }
        });
    }
    static requestPasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    return;
                }
                const resetToken = (0, uuid_1.v4)();
                const resetTokenExpiry = new Date(Date.now() + config_1.default.auth.resetTokenExpiresIn);
                yield database_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        resetToken,
                        resetTokenExpiry,
                    },
                });
                return resetToken;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.requestPasswordReset: ${error}`);
                throw error;
            }
        });
    }
    static resetPassword(resetToken, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findFirst({
                    where: {
                        resetToken,
                        resetTokenExpiry: {
                            gt: new Date(),
                        },
                    },
                });
                if (!user) {
                    throw new errors_1.AuthError("Invalid or expired reset token");
                }
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, config_1.default.auth.bcrypt.saltRounds);
                yield database_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        password: hashedPassword,
                        resetToken: null,
                        resetTokenExpiry: null,
                    },
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.resetPassword: ${error}`);
                throw error;
            }
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield database_1.default.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                        avatarUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return users;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.getAll: ${error}`);
                throw error;
            }
        });
    }
    static update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield database_1.default.user.findUnique({
                    where: { id },
                });
                if (!existingUser) {
                    throw new errors_1.NotFoundError("User not found");
                }
                if (data.email && data.email !== existingUser.email) {
                    const emailExists = yield database_1.default.user.findUnique({
                        where: { email: data.email },
                    });
                    if (emailExists) {
                        throw new errors_1.ConflictError("Email already in use");
                    }
                }
                const updatedUser = yield database_1.default.user.update({
                    where: { id },
                    data,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                        avatarUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                return updatedUser;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.update: ${error}`);
                throw error;
            }
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield database_1.default.user.findUnique({
                    where: { id },
                });
                if (!user) {
                    throw new errors_1.NotFoundError("User not found");
                }
                yield database_1.default.user.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in UserModel.delete: ${error}`);
                throw error;
            }
        });
    }
}
exports.UserModel = UserModel;
exports.default = UserModel;
