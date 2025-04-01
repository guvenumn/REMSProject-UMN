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
exports.MessageService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class MessageService {
    static getUserConversations(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversations = yield prisma.conversation.findMany({
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
                return conversations.map((conversation) => {
                    const otherParticipants = conversation.participants
                        .filter((p) => p.userId !== userId)
                        .map((p) => ({
                        id: p.user.id,
                        name: p.user.name,
                        email: p.user.email,
                        avatarUrl: p.user.avatarUrl,
                    }));
                    const currentUserParticipant = conversation.participants.find((p) => p.userId === userId);
                    const lastMessage = conversation.messages[0] || null;
                    let unreadCount = (currentUserParticipant === null || currentUserParticipant === void 0 ? void 0 : currentUserParticipant.unreadCount) || 0;
                    return {
                        id: conversation.id,
                        title: conversation.title ||
                            (otherParticipants.length > 0
                                ? otherParticipants[0].name
                                : "Conversation"),
                        participants: [
                            {
                                id: userId,
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
                        isInquiry: conversation.isInquiry,
                        inquiryStatus: conversation.inquiryStatus,
                    };
                });
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.getUserConversations: ${error}`);
                throw error;
            }
        });
    }
    static getConversationDetails(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield prisma.conversation.findFirst({
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
                        inquiries: true,
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
                return {
                    id: conversation.id,
                    title: conversation.title,
                    participants,
                    property: conversation.property,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    isArchived: conversation.isArchived,
                    isInquiry: conversation.isInquiry,
                    inquiryStatus: conversation.inquiryStatus,
                    inquiryId: conversation.inquiries.length > 0
                        ? conversation.inquiries[0].id
                        : null,
                };
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.getConversationDetails: ${error}`);
                throw error;
            }
        });
    }
    static getConversationMessages(conversationId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (conversationId, userId, options = {}) {
            try {
                const { limit = 50, before } = options;
                const conversation = yield prisma.conversation.findFirst({
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
                let whereClause = {
                    conversationId: conversationId,
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
                yield prisma.$transaction([
                    prisma.message.updateMany({
                        where: {
                            conversationId: conversationId,
                            senderId: { not: userId },
                            isRead: false,
                        },
                        data: {
                            isRead: true,
                            readAt: new Date(),
                        },
                    }),
                    prisma.conversationParticipant.updateMany({
                        where: {
                            conversationId: conversationId,
                            userId: userId,
                        },
                        data: {
                            lastReadAt: new Date(),
                            unreadCount: 0,
                        },
                    }),
                    prisma.conversation.update({
                        where: { id: conversationId },
                        data: {
                            unreadCount: yield prisma.message.count({
                                where: {
                                    conversationId: conversationId,
                                    isRead: false,
                                },
                            }),
                        },
                    }),
                ]);
                const chronologicalMessages = [...messages].reverse();
                return {
                    messages: chronologicalMessages,
                    pagination: {
                        hasMore: messages.length === limit,
                        nextCursor: messages.length > 0 ? messages[0].sentAt.toISOString() : null,
                    },
                };
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.getConversationMessages: ${error}`);
                throw error;
            }
        });
    }
    static sendMessage(conversationId, userId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!content || !content.trim()) {
                    throw new errors_1.BadRequestError("Message content is required");
                }
                const conversation = yield prisma.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: {
                                userId: userId,
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
                return yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const isInquiryResponse = conversation.isInquiry &&
                        userId !== conversation.participants[0].userId;
                    const message = yield tx.message.create({
                        data: {
                            conversationId: conversationId,
                            senderId: userId,
                            content: content.trim(),
                            isRead: false,
                            isInquiryResponse,
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
                    for (const participant of conversation.participants) {
                        if (participant.userId !== userId) {
                            yield tx.conversationParticipant.update({
                                where: {
                                    id: participant.id,
                                },
                                data: {
                                    unreadCount: {
                                        increment: 1,
                                    },
                                },
                            });
                        }
                    }
                    yield tx.conversation.update({
                        where: { id: conversationId },
                        data: {
                            updatedAt: new Date(),
                            unreadCount: {
                                increment: conversation.participants.length - 1,
                            },
                        },
                    });
                    if (isInquiryResponse && conversation.inquiryStatus === "NEW") {
                        yield tx.conversation.update({
                            where: { id: conversationId },
                            data: {
                                inquiryStatus: "RESPONDED",
                            },
                        });
                        yield tx.propertyInquiry.updateMany({
                            where: {
                                conversationId: conversationId,
                                status: "NEW",
                            },
                            data: {
                                status: "RESPONDED",
                                respondedAt: new Date(),
                            },
                        });
                    }
                    return message;
                }));
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.sendMessage: ${error}`);
                throw error;
            }
        });
    }
    static startConversation(userId_1, recipientId_1, initialMessage_1) {
        return __awaiter(this, arguments, void 0, function* (userId, recipientId, initialMessage, options = {}) {
            try {
                const { propertyId, title, isInquiry = false } = options;
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
                            isInquiry ? { isInquiry: true } : {},
                        ],
                    },
                });
                return yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    let conversationId;
                    let propertyInquiryId;
                    if (existingConversation) {
                        conversationId = existingConversation.id;
                        yield tx.conversationParticipant.updateMany({
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
                        if (isInquiry && propertyId) {
                            const inquiry = yield tx.propertyInquiry.create({
                                data: {
                                    propertyId,
                                    userId,
                                    message: initialMessage.trim(),
                                    status: "NEW",
                                },
                            });
                            propertyInquiryId = inquiry.id;
                        }
                        const newConversation = yield tx.conversation.create({
                            data: {
                                title,
                                propertyId,
                                isInquiry,
                                inquiryStatus: isInquiry ? "NEW" : null,
                                participants: {
                                    create: [{ userId: userId }, { userId: recipientId }],
                                },
                                inquiries: propertyInquiryId
                                    ? {
                                        connect: {
                                            id: propertyInquiryId,
                                        },
                                    }
                                    : undefined,
                            },
                        });
                        conversationId = newConversation.id;
                        if (propertyInquiryId) {
                            yield tx.propertyInquiry.update({
                                where: { id: propertyInquiryId },
                                data: {
                                    conversationId: conversationId,
                                },
                            });
                        }
                    }
                    const message = yield tx.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            content: initialMessage.trim(),
                            isRead: false,
                        },
                    });
                    yield tx.conversationParticipant.updateMany({
                        where: {
                            conversationId,
                            userId: recipientId,
                        },
                        data: {
                            unreadCount: {
                                increment: 1,
                            },
                        },
                    });
                    yield tx.conversation.update({
                        where: { id: conversationId },
                        data: {
                            updatedAt: new Date(),
                            unreadCount: 1,
                        },
                    });
                    const conversation = yield tx.conversation.findUnique({
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
                    if (!conversation) {
                        throw new Error("Failed to retrieve conversation after creation");
                    }
                    return {
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
                        isInquiry: conversation.isInquiry,
                        inquiryStatus: conversation.inquiryStatus,
                    };
                }));
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.startConversation: ${error}`);
                throw error;
            }
        });
    }
    static markConversationAsRead(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield prisma.conversation.findFirst({
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
                yield prisma.$transaction([
                    prisma.message.updateMany({
                        where: {
                            conversationId: conversationId,
                            senderId: { not: userId },
                            isRead: false,
                        },
                        data: {
                            isRead: true,
                            readAt: new Date(),
                        },
                    }),
                    prisma.conversationParticipant.updateMany({
                        where: {
                            conversationId: conversationId,
                            userId: userId,
                        },
                        data: {
                            lastReadAt: new Date(),
                            unreadCount: 0,
                        },
                    }),
                    prisma.conversation.update({
                        where: { id: conversationId },
                        data: {
                            unreadCount: yield prisma.conversationParticipant
                                .aggregate({
                                where: {
                                    conversationId: conversationId,
                                },
                                _sum: {
                                    unreadCount: true,
                                },
                            })
                                .then((result) => result._sum.unreadCount || 0),
                        },
                    }),
                ]);
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.markConversationAsRead: ${error}`);
                throw error;
            }
        });
    }
    static archiveConversation(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield prisma.conversation.findFirst({
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
                yield prisma.conversationParticipant.updateMany({
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
                logger_1.logger.error(`Error in MessageService.archiveConversation: ${error}`);
                throw error;
            }
        });
    }
    static createPropertyInquiry(userId, agentId, propertyId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const inquiry = yield tx.propertyInquiry.create({
                        data: {
                            propertyId,
                            userId,
                            message,
                            status: "NEW",
                        },
                    });
                    const conversation = yield tx.conversation.create({
                        data: {
                            isInquiry: true,
                            inquiryStatus: "NEW",
                            propertyId,
                            title: `Inquiry about property`,
                            participants: {
                                create: [{ userId }, { userId: agentId }],
                            },
                            inquiries: {
                                connect: {
                                    id: inquiry.id,
                                },
                            },
                        },
                    });
                    yield tx.propertyInquiry.update({
                        where: { id: inquiry.id },
                        data: {
                            conversationId: conversation.id,
                        },
                    });
                    yield tx.message.create({
                        data: {
                            conversationId: conversation.id,
                            senderId: userId,
                            content: message,
                            isRead: false,
                        },
                    });
                    yield tx.conversationParticipant.update({
                        where: {
                            conversationId_userId: {
                                conversationId: conversation.id,
                                userId: agentId,
                            },
                        },
                        data: {
                            unreadCount: 1,
                        },
                    });
                    yield tx.conversation.update({
                        where: { id: conversation.id },
                        data: {
                            unreadCount: 1,
                        },
                    });
                    return {
                        conversation,
                        inquiry,
                    };
                }));
            }
            catch (error) {
                logger_1.logger.error(`Error creating property inquiry: ${error}`);
                throw error;
            }
        });
    }
    static updateInquiryStatus(inquiryId, status, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const inquiry = yield tx.propertyInquiry.findUnique({
                        where: { id: inquiryId },
                        include: {
                            conversation: true,
                        },
                    });
                    if (!inquiry) {
                        throw new errors_1.NotFoundError("Inquiry not found");
                    }
                    const updatedInquiry = yield tx.propertyInquiry.update({
                        where: { id: inquiryId },
                        data: {
                            status,
                            respondedAt: status === "RESPONDED" && inquiry.status !== "RESPONDED"
                                ? new Date()
                                : undefined,
                        },
                    });
                    if (inquiry.conversationId) {
                        yield tx.conversation.update({
                            where: { id: inquiry.conversationId },
                            data: { inquiryStatus: status },
                        });
                    }
                    return updatedInquiry;
                }));
            }
            catch (error) {
                logger_1.logger.error(`Error updating inquiry status: ${error}`);
                throw error;
            }
        });
    }
    static getAllCommunications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversations = yield prisma.conversation.findMany({
                    where: {
                        participants: {
                            some: {
                                userId,
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
                        property: {
                            select: {
                                id: true,
                                title: true,
                                images: {
                                    take: 1,
                                },
                            },
                        },
                        inquiries: true,
                        messages: {
                            orderBy: {
                                sentAt: "desc",
                            },
                            take: 1,
                        },
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                });
                const standaloneInquiries = yield prisma.propertyInquiry.findMany({
                    where: {
                        userId,
                        conversationId: null,
                    },
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                images: {
                                    take: 1,
                                },
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return {
                    conversations,
                    standaloneInquiries,
                };
            }
            catch (error) {
                logger_1.logger.error(`Error fetching all communications: ${error}`);
                throw error;
            }
        });
    }
    static getUnreadMessageCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const unreadCounts = yield prisma.conversationParticipant.aggregate({
                    where: {
                        userId,
                        isActive: true,
                    },
                    _sum: {
                        unreadCount: true,
                    },
                });
                return unreadCounts._sum.unreadCount || 0;
            }
            catch (error) {
                logger_1.logger.error(`Error in MessageService.getUnreadMessageCount: ${error}`);
                throw error;
            }
        });
    }
}
exports.MessageService = MessageService;
exports.default = MessageService;
