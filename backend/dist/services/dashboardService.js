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
exports.getSystemStatus = exports.getAdminStats = exports.getRecentActivity = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const getDashboardStats = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (role === "USER") {
            const savedProperties = yield prisma.savedProperty.count({
                where: { userId },
            });
            const savedSearches = yield prisma.savedSearch.count({
                where: { userId },
            });
            const inquiries = yield prisma.propertyInquiry.count({
                where: { userId },
            });
            return {
                savedProperties,
                savedSearches,
                inquiries,
                totalProperties: 0,
                activeListings: 0,
                newInquiries: 0,
            };
        }
        const totalProperties = yield prisma.property.count({
            where: { agentId: userId },
        });
        const activeListings = yield prisma.property.count({
            where: {
                agentId: userId,
                status: { in: ["AVAILABLE", "PENDING"] },
            },
        });
        const newInquiries = yield prisma.propertyInquiry.count({
            where: {
                property: { agentId: userId },
                status: "NEW",
            },
        });
        const savedSearches = yield prisma.savedSearch.count({
            where: { userId },
        });
        return {
            totalProperties,
            activeListings,
            newInquiries,
            savedSearches,
        };
    }
    catch (error) {
        console.error("Error getting dashboard stats:", error);
        throw new errors_1.ApiError("Failed to get dashboard statistics", 500);
    }
});
exports.getDashboardStats = getDashboardStats;
const getRecentActivity = (userId_1, role_1, ...args_1) => __awaiter(void 0, [userId_1, role_1, ...args_1], void 0, function* (userId, role, limit = 5) {
    try {
        const activities = [];
        if (role === "AGENT") {
            const inquiries = yield prisma.propertyInquiry.findMany({
                where: {
                    property: { agentId: userId },
                },
                include: {
                    property: {
                        select: {
                            title: true,
                        },
                    },
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: limit,
            });
            inquiries.forEach((inquiry) => {
                activities.push({
                    id: inquiry.id,
                    action: "New inquiry received",
                    property: inquiry.property.title,
                    time: inquiry.createdAt.toISOString(),
                    meta: {
                        inquiryId: inquiry.id,
                        userName: inquiry.user.name,
                    },
                });
            });
        }
        const savedProperties = yield prisma.savedProperty.findMany({
            where: { userId },
            include: {
                property: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });
        savedProperties.forEach((saved) => {
            activities.push({
                id: saved.id,
                action: "Property saved",
                property: saved.property.title,
                time: saved.createdAt.toISOString(),
            });
        });
        return activities
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, limit);
    }
    catch (error) {
        console.error("Error getting recent activity:", error);
        throw new errors_1.ApiError("Failed to get recent activity", 500);
    }
});
exports.getRecentActivity = getRecentActivity;
const getAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalUsers, totalAgents, totalProperties, activeListings] = yield Promise.all([
            prisma.user.count({
                where: { role: "USER" },
            }),
            prisma.user.count({
                where: { role: "AGENT" },
            }),
            prisma.property.count(),
            prisma.property.count({
                where: { status: { in: ["AVAILABLE", "PENDING"] } },
            }),
        ]);
        return {
            totalUsers,
            totalAgents,
            totalProperties,
            activeListings,
        };
    }
    catch (error) {
        console.error("Error getting admin stats:", error);
        throw new errors_1.ApiError("Failed to get admin statistics", 500);
    }
});
exports.getAdminStats = getAdminStats;
const getSystemStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return {
            api: "operational",
            database: "operational",
            storage: "operational",
            auth: "operational",
        };
    }
    catch (error) {
        console.error("Error checking system status:", error);
        throw new errors_1.ApiError("Failed to check system status", 500);
    }
});
exports.getSystemStatus = getSystemStatus;
