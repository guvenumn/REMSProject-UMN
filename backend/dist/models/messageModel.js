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
exports.MessageModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class MessageModel {
    static getConversations(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversations = yield database_1.default.conversation.findMany({
                    where: {
                        participants: {
                            some: {
                                userId: userId,
                                isActive: true,
                            },
                        },
                        isArchived: false,
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
                return conversations;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.getConversations: ${error}`);
                throw error;
            }
        });
    }
    static getConversation(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield database_1.default.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
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
                return conversation;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.getConversation: ${error}`);
                throw error;
            }
        });
    }
    static getMessages(conversationId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (conversationId, userId, options = {}) {
            try {
                const conversation = yield database_1.default.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                });
                if (!conversation) {
                    throw new errors_1.NotFoundError("Conversation not found");
                }
                const { limit = 50, before } = options;
                let whereClause = {
                    conversationId: conversationId,
                };
                if (before) {
                    whereClause.sentAt = {
                        lt: before,
                    };
                }
                const messages = yield database_1.default.message.findMany({
                    where: whereClause,
                    orderBy: {
                        sentAt: "desc",
                    },
                    take: limit,
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
                return messages;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.getMessages: ${error}`);
                throw error;
            }
        });
    }
    static sendMessage(conversationId, userId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield database_1.default.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                });
                if (!conversation) {
                    throw new errors_1.NotFoundError("Conversation not found");
                }
                const message = yield database_1.default.message.create({
                    data: {
                        conversationId: conversationId,
                        senderId: userId,
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
                yield database_1.default.conversation.update({
                    where: { id: conversationId },
                    data: {
                        updatedAt: new Date(),
                    },
                });
                return message;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.sendMessage: ${error}`);
                throw error;
            }
        });
    }
    static startConversation(userId_1, recipientId_1, initialMessage_1) {
        return __awaiter(this, arguments, void 0, function* (userId, recipientId, initialMessage, options = {}) {
            try {
                const { propertyId, title } = options;
                const existingConversation = yield database_1.default.conversation.findFirst({
                    where: {
                        AND: [
                            {
                                participants: {
                                    some: {
                                        userId: userId,
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
                    yield database_1.default.conversationParticipant.updateMany({
                        where: {
                            conversationId,
                            userId: {
                                in: [userId, recipientId],
                            },
                        },
                        data: {
                            isActive: true,
                        },
                    });
                }
                else {
                    const newConversation = yield database_1.default.conversation.create({
                        data: {
                            title,
                            propertyId,
                            participants: {
                                create: [{ userId: userId }, { userId: recipientId }],
                            },
                        },
                    });
                    conversationId = newConversation.id;
                }
                const message = yield database_1.default.message.create({
                    data: {
                        conversationId,
                        senderId: userId,
                        content: initialMessage.trim(),
                        isRead: false,
                    },
                });
                yield database_1.default.conversation.update({
                    where: { id: conversationId },
                    data: {
                        updatedAt: new Date(),
                    },
                });
                const conversation = yield database_1.default.conversation.findUnique({
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
                return {
                    conversation,
                    message,
                };
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.startConversation: ${error}`);
                throw error;
            }
        });
    }
    static markAsRead(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield database_1.default.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                });
                if (!conversation) {
                    throw new errors_1.NotFoundError("Conversation not found");
                }
                yield database_1.default.message.updateMany({
                    where: {
                        conversationId: conversationId,
                        senderId: { not: userId },
                        isRead: false,
                    },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
                yield database_1.default.conversationParticipant.updateMany({
                    where: {
                        conversationId: conversationId,
                        userId: userId,
                    },
                    data: {
                        lastReadAt: new Date(),
                    },
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.markAsRead: ${error}`);
                throw error;
            }
        });
    }
    static archive(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield database_1.default.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                });
                if (!conversation) {
                    throw new errors_1.NotFoundError("Conversation not found");
                }
                yield database_1.default.conversationParticipant.updateMany({
                    where: {
                        conversationId: conversationId,
                        userId: userId,
                    },
                    data: {
                        isActive: false,
                    },
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.archive: ${error}`);
                throw error;
            }
        });
    }
    static getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userParticipations = yield database_1.default.conversationParticipant.findMany({
                    where: {
                        userId: userId,
                        isActive: true,
                    },
                    include: {
                        conversation: {
                            include: {
                                messages: {
                                    where: {
                                        senderId: { not: userId },
                                        isRead: false,
                                    },
                                },
                            },
                        },
                    },
                });
                let totalUnread = 0;
                for (const participation of userParticipations) {
                    if (participation.lastReadAt) {
                        const unreadCount = yield database_1.default.message.count({
                            where: {
                                conversationId: participation.conversationId,
                                senderId: { not: userId },
                                sentAt: { gt: participation.lastReadAt },
                            },
                        });
                        totalUnread += unreadCount;
                    }
                    else {
                        totalUnread += participation.conversation.messages.length;
                    }
                }
                return totalUnread;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageModel.getUnreadCount: ${error}`);
                throw error;
            }
        });
    }
}
exports.MessageModel = MessageModel;
exports.default = MessageModel;
