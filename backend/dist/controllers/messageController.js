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
exports.getUnreadMessageCount = exports.archiveConversation = exports.markConversationAsRead = exports.startConversation = exports.sendMessage = exports.getMessages = exports.getConversation = exports.updateConversationStatus = exports.getConversations = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const getConversations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const isInquiry = req.query.isInquiry === "true"
            ? true
            : req.query.isInquiry === "false"
                ? false
                : undefined;
        const status = req.query.status;
        const propertyId = req.query.propertyId;
        let whereClause = {
            participants: {
                some: {
                    userId: req.userId,
                    isActive: true,
                },
            },
            isArchived: false,
        };
        if (isInquiry !== undefined) {
            whereClause.isInquiry = isInquiry;
        }
        if (status && ["NEW", "RESPONDED", "CLOSED"].includes(status)) {
            whereClause.inquiryStatus = status;
        }
        if (propertyId) {
            whereClause.propertyId = propertyId;
        }
        const conversations = yield prisma.conversation.findMany({
            where: whereClause,
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: {
                        sentAt: "desc",
                    },
                    take: 1,
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: {
                            take: 1,
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        const formattedConversations = conversations.map((conversation) => {
            const otherParticipants = conversation.participants
                .filter((p) => p.userId !== req.userId)
                .map((p) => ({
                id: p.user.id,
                name: p.user.name,
                email: p.user.email,
                avatarUrl: p.user.avatarUrl,
            }));
            const currentUserParticipant = conversation.participants.find((p) => p.userId === req.userId);
            const lastMessage = conversation.messages[0] || null;
            let unreadCount = 0;
            if (currentUserParticipant === null || currentUserParticipant === void 0 ? void 0 : currentUserParticipant.lastReadAt) {
                unreadCount =
                    lastMessage &&
                        lastMessage.senderId !== req.userId &&
                        (!currentUserParticipant.lastReadAt ||
                            new Date(lastMessage.sentAt) >
                                new Date(currentUserParticipant.lastReadAt))
                        ? 1
                        : 0;
            }
            return {
                id: conversation.id,
                title: conversation.title ||
                    (otherParticipants.length > 0
                        ? otherParticipants[0].name
                        : "Conversation"),
                participants: [
                    {
                        id: req.userId,
                        name: "You",
                    },
                    ...otherParticipants,
                ],
                lastMessage: lastMessage
                    ? {
                        content: lastMessage.content,
                        createdAt: lastMessage.sentAt,
                        senderId: lastMessage.senderId,
                    }
                    : null,
                unreadCount,
                property: conversation.property,
                updatedAt: conversation.updatedAt,
                isInquiry: conversation.isInquiry || false,
                inquiryStatus: conversation.inquiryStatus,
            };
        });
        logger_1.logger.info(`Retrieved ${formattedConversations.length} conversations for user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: formattedConversations,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving conversations: ${error}`);
        next(error);
    }
});
exports.getConversations = getConversations;
const updateConversationStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const { status, isInquiry } = req.body;
        if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
            throw new errors_1.BadRequestError("Valid status is required (NEW, RESPONDED, CLOSED)");
        }
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
            include: {
                inquiries: true,
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        const updatedConversation = yield prisma.conversation.update({
            where: { id },
            data: {
                inquiryStatus: status,
                isInquiry: isInquiry === true ? true : conversation.isInquiry || false,
            },
        });
        if (conversation.inquiries && conversation.inquiries.length > 0) {
            yield prisma.propertyInquiry.updateMany({
                where: {
                    conversationId: id,
                },
                data: {
                    status,
                    respondedAt: status === "RESPONDED" ? new Date() : undefined,
                },
            });
            logger_1.logger.info(`Updated ${conversation.inquiries.length} linked inquiries to status: ${status}`);
        }
        logger_1.logger.info(`Updated conversation ${id} status to ${status} by user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: updatedConversation,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating conversation status: ${error}`);
        next(error);
    }
});
exports.updateConversationStatus = updateConversationStatus;
const getConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: {
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        const participants = conversation.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            avatarUrl: p.user.avatarUrl,
        }));
        logger_1.logger.info(`Retrieved conversation ${id} for user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: {
                id: conversation.id,
                title: conversation.title,
                participants,
                property: conversation.property,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                isArchived: conversation.isArchived,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving conversation: ${error}`);
        next(error);
    }
});
exports.getConversation = getConversation;
const getMessages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const { limit = "50", before } = req.query;
        const pageSize = parseInt(limit) || 50;
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
            include: {
                participants: {
                    where: {
                        userId: req.userId,
                    },
                },
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        let whereClause = {
            conversationId: id,
        };
        if (before) {
            whereClause.sentAt = {
                lt: new Date(before),
            };
        }
        const messages = yield prisma.message.findMany({
            where: whereClause,
            orderBy: {
                sentAt: "desc",
            },
            take: pageSize,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        const chronologicalMessages = [...messages].reverse();
        logger_1.logger.info(`Retrieved ${messages.length} messages for conversation ${id}`);
        res.status(200).json({
            success: true,
            data: chronologicalMessages,
            pagination: {
                hasMore: messages.length === pageSize,
                nextCursor: messages.length > 0 ? messages[0].sentAt.toISOString() : null,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving messages: ${error}`);
        next(error);
    }
});
exports.getMessages = getMessages;
const sendMessage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) {
            throw new errors_1.BadRequestError("Message content is required");
        }
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
            include: {
                participants: true,
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        const message = yield prisma.message.create({
            data: {
                conversationId: id,
                senderId: req.userId,
                content: content.trim(),
                isRead: false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        yield prisma.conversation.update({
            where: { id },
            data: {
                updatedAt: new Date(),
            },
        });
        logger_1.logger.info(`Sent message to conversation ${id} by user ${req.userId}`);
        res.status(201).json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error sending message: ${error}`);
        next(error);
    }
});
exports.sendMessage = sendMessage;
const startConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { recipientId, initialMessage, propertyId, title } = req.body;
        if (!recipientId) {
            throw new errors_1.BadRequestError("Recipient ID is required");
        }
        if (!initialMessage || !initialMessage.trim()) {
            throw new errors_1.BadRequestError("Initial message is required");
        }
        const recipient = yield prisma.user.findUnique({
            where: { id: recipientId },
        });
        if (!recipient) {
            throw new errors_1.NotFoundError("Recipient not found");
        }
        const existingConversation = yield prisma.conversation.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            some: {
                                userId: req.userId,
                            },
                        },
                    },
                    {
                        participants: {
                            some: {
                                userId: recipientId,
                            },
                        },
                    },
                    propertyId ? { propertyId } : {},
                ],
            },
        });
        let conversationId;
        if (existingConversation) {
            conversationId = existingConversation.id;
            yield prisma.conversationParticipant.updateMany({
                where: {
                    conversationId,
                    userId: {
                        in: [req.userId, recipientId],
                    },
                },
                data: {
                    isActive: true,
                },
            });
            logger_1.logger.info(`Using existing conversation ${conversationId} for users ${req.userId} and ${recipientId}`);
        }
        else {
            const newConversation = yield prisma.conversation.create({
                data: {
                    title,
                    propertyId,
                    participants: {
                        create: [{ userId: req.userId }, { userId: recipientId }],
                    },
                },
            });
            conversationId = newConversation.id;
            logger_1.logger.info(`Created new conversation ${conversationId} between users ${req.userId} and ${recipientId}`);
        }
        const message = yield prisma.message.create({
            data: {
                conversationId,
                senderId: req.userId,
                content: initialMessage.trim(),
                isRead: false,
            },
        });
        yield prisma.conversation.update({
            where: { id: conversationId },
            data: {
                updatedAt: new Date(),
            },
        });
        const conversation = yield prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                property: propertyId
                    ? {
                        select: {
                            id: true,
                            title: true,
                            images: {
                                take: 1,
                            },
                        },
                    }
                    : false,
            },
        });
        const formattedConversation = {
            id: conversation.id,
            title: conversation.title,
            participants: conversation.participants.map((p) => ({
                id: p.user.id,
                name: p.user.name,
                email: p.user.email,
                avatarUrl: p.user.avatarUrl,
            })),
            property: conversation.property,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            lastMessage: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                sentAt: message.sentAt,
            },
        };
        res.status(201).json({
            success: true,
            data: formattedConversation,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error starting conversation: ${error}`);
        next(error);
    }
});
exports.startConversation = startConversation;
const markConversationAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        yield prisma.message.updateMany({
            where: {
                conversationId: id,
                senderId: { not: req.userId },
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        yield prisma.conversationParticipant.updateMany({
            where: {
                conversationId: id,
                userId: req.userId,
            },
            data: {
                lastReadAt: new Date(),
            },
        });
        logger_1.logger.info(`Marked conversation ${id} as read by user ${req.userId}`);
        res.status(200).json({
            success: true,
            message: "Conversation marked as read",
        });
    }
    catch (error) {
        logger_1.logger.error(`Error marking conversation as read: ${error}`);
        next(error);
    }
});
exports.markConversationAsRead = markConversationAsRead;
const archiveConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Conversation not found");
        }
        yield prisma.conversationParticipant.updateMany({
            where: {
                conversationId: id,
                userId: req.userId,
            },
            data: {
                isActive: false,
            },
        });
        logger_1.logger.info(`Archived conversation ${id} for user ${req.userId}`);
        res.status(200).json({
            success: true,
            message: "Conversation archived",
        });
    }
    catch (error) {
        logger_1.logger.error(`Error archiving conversation: ${error}`);
        next(error);
    }
});
exports.archiveConversation = archiveConversation;
const getUnreadMessageCount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const conversations = yield prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: req.userId,
                        isActive: true,
                    },
                },
                isArchived: false,
            },
            include: {
                participants: {
                    where: {
                        userId: req.userId,
                    },
                },
                messages: {
                    where: {
                        senderId: { not: req.userId },
                        isRead: false,
                    },
                    orderBy: {
                        sentAt: "desc",
                    },
                },
            },
        });
        let totalUnread = 0;
        for (const conversation of conversations) {
            const lastReadAt = (_a = conversation.participants[0]) === null || _a === void 0 ? void 0 : _a.lastReadAt;
            if (!lastReadAt) {
                totalUnread += conversation.messages.length;
            }
            else {
                totalUnread += conversation.messages.filter((m) => new Date(m.sentAt) > new Date(lastReadAt)).length;
            }
        }
        logger_1.logger.info(`User ${req.userId} has ${totalUnread} unread messages`);
        res.status(200).json({
            success: true,
            data: {
                count: totalUnread,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting unread message count: ${error}`);
        next(error);
    }
});
exports.getUnreadMessageCount = getUnreadMessageCount;
