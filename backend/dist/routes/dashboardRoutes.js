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
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
router.get("/stats", authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user || !req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const userId = req.userId;
        logger_1.logger.info(`Fetching dashboard stats for user ${userId}`);
        const [propertiesCount, conversationsCount, inquiriesCount, unreadMessagesCount,] = yield Promise.all([
            database_1.default.property.count({
                where: {
                    agentId: userId,
                },
            }),
            database_1.default.conversation.count({
                where: {
                    participants: {
                        some: {
                            userId,
                        },
                    },
                },
            }),
            database_1.default.propertyInquiry.count({
                where: {
                    property: {
                        agentId: userId,
                    },
                },
            }),
            database_1.default.conversationParticipant.aggregate({
                where: {
                    userId,
                    unreadCount: {
                        gt: 0,
                    },
                },
                _sum: {
                    unreadCount: true,
                },
            }),
        ]);
        res.json({
            success: true,
            data: {
                totalProperties: propertiesCount,
                totalConversations: conversationsCount,
                totalInquiries: inquiriesCount,
                unreadMessages: ((_a = unreadMessagesCount._sum) === null || _a === void 0 ? void 0 : _a.unreadCount) || 0,
                monthlyViews: 0,
                recentListings: 0,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching dashboard stats: ${error}`);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
        });
    }
}));
router.get("/activity", authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 5;
        logger_1.logger.info(`Fetching dashboard activity for user ${userId}, limit: ${limit}`);
        const recentMessages = yield database_1.default.message.findMany({
            where: {
                conversation: {
                    participants: {
                        some: {
                            userId,
                        },
                    },
                },
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                conversation: {
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                sentAt: "desc",
            },
            take: limit,
        });
        const recentInquiries = yield database_1.default.propertyInquiry.findMany({
            where: {
                property: {
                    agentId: userId,
                },
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                user: {
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
            take: limit,
        });
        const messageActivities = recentMessages.map((message) => ({
            id: message.id,
            type: "message_received",
            user: {
                id: message.sender.id,
                name: message.sender.name,
                avatarUrl: message.sender.avatarUrl,
            },
            target: message.conversation.property
                ? {
                    id: message.conversation.property.id,
                    type: "property",
                    title: message.conversation.property.title,
                }
                : undefined,
            timestamp: message.sentAt.toISOString(),
            preview: message.content.substring(0, 100) +
                (message.content.length > 100 ? "..." : ""),
        }));
        const inquiryActivities = recentInquiries.map((inquiry) => ({
            id: inquiry.id,
            type: "inquiry_received",
            user: {
                id: inquiry.user.id,
                name: inquiry.user.name,
                avatarUrl: inquiry.user.avatarUrl,
            },
            target: {
                id: inquiry.property.id,
                type: "property",
                title: inquiry.property.title,
            },
            timestamp: inquiry.createdAt.toISOString(),
            preview: inquiry.message.substring(0, 100) +
                (inquiry.message.length > 100 ? "..." : ""),
        }));
        const activities = [...messageActivities, ...inquiryActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
        res.json({
            success: true,
            data: activities,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching dashboard activity: ${error}`);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard activity",
        });
    }
}));
exports.default = router;
