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
exports.searchProperties = exports.searchUsers = exports.searchAll = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const searchAll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query.query;
        const type = req.query.type || "all";
        const limit = parseInt(req.query.limit) || 10;
        if (!query || query.length < 2) {
            res.status(200).json({
                success: true,
                data: { users: [], properties: [], total: 0 },
            });
            return;
        }
        const users = [];
        const properties = [];
        let total = 0;
        if (type === "users" || type === "all") {
            const foundUsers = yield prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
                take: limit,
            });
            users.push(...foundUsers);
            total += foundUsers.length;
        }
        if (type === "properties" || type === "all") {
            const foundProperties = yield prisma.property.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { description: { contains: query, mode: "insensitive" } },
                        { address: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    status: true,
                    propertyType: true,
                    images: {
                        take: 1,
                        select: {
                            url: true,
                        },
                    },
                },
                take: limit,
            });
            properties.push(...foundProperties);
            total += foundProperties.length;
        }
        logger_1.logger.info(`Search query "${query}" returned ${total} results`);
        if (type === "users") {
            res.status(200).json({
                success: true,
                data: { users, total: users.length },
            });
        }
        else if (type === "properties") {
            res.status(200).json({
                success: true,
                data: { properties, total: properties.length },
            });
        }
        else {
            res.status(200).json({
                success: true,
                data: { users, properties, total },
            });
        }
    }
    catch (error) {
        logger_1.logger.error(`Error during search: ${error}`);
        next(error);
    }
});
exports.searchAll = searchAll;
const searchUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.searchAll)(req, res, next);
});
exports.searchUsers = searchUsers;
const searchProperties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.searchAll)(req, res, next);
});
exports.searchProperties = searchProperties;
