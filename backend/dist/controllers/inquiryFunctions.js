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
exports.updateInquiryStatus = exports.createPropertyInquiry = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const createPropertyInquiry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { propertyId, message, subject } = req.body;
        if (!propertyId) {
            throw new errors_1.BadRequestError("Property ID is required");
        }
        if (!message || !message.trim()) {
            throw new errors_1.BadRequestError("Message content is required");
        }
        const property = yield prisma.property.findUnique({
            where: { id: propertyId },
            select: {
                id: true,
                title: true,
                agentId: true,
            },
        });
        if (!property) {
            throw new errors_1.NotFoundError("Property not found");
        }
        const userId = req.userId;
        const conversation = yield prisma.conversation.create({
            data: {
                title: subject || `Inquiry about property: ${property.title || propertyId}`,
                propertyId,
                isInquiry: true,
                inquiryStatus: "NEW",
                participants: {
                    create: [
                        { userId: userId },
                        { userId: property.agentId },
                    ],
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
        const firstMessage = yield prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                content: message.trim(),
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
        yield prisma.conversationParticipant.updateMany({
            where: {
                conversationId: conversation.id,
                userId: property.agentId,
            },
            data: {
                unreadCount: 1,
            },
        });
        yield prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                unreadCount: 1,
            },
        });
        logger_1.logger.info(`Created property inquiry from user ${userId} for property ${propertyId}`);
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
            isInquiry: true,
            inquiryStatus: "NEW",
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            firstMessage: firstMessage,
        };
        res.status(201).json(formattedConversation);
    }
    catch (error) {
        logger_1.logger.error(`Error creating property inquiry: ${error}`);
        next(error);
    }
});
exports.createPropertyInquiry = createPropertyInquiry;
const updateInquiryStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
            throw new errors_1.BadRequestError("Valid status is required (NEW, RESPONDED, or CLOSED)");
        }
        const conversation = yield prisma.conversation.findFirst({
            where: {
                id,
                isInquiry: true,
                participants: {
                    some: {
                        userId: req.userId,
                    },
                },
            },
            include: {
                property: {
                    select: {
                        agentId: true,
                    },
                },
            },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError("Inquiry conversation not found");
        }
        const userId = req.userId;
        if (((_a = conversation.property) === null || _a === void 0 ? void 0 : _a.agentId) !== userId) {
            throw new errors_1.ApiError("Only the property agent can update inquiry status", 403);
        }
        const updatedConversation = yield prisma.conversation.update({
            where: { id },
            data: {
                inquiryStatus: status,
                updatedAt: new Date(),
            },
        });
        logger_1.logger.info(`Updated inquiry status to ${status} for conversation ${id} by user ${userId}`);
        res.status(200).json({
            id: updatedConversation.id,
            inquiryStatus: updatedConversation.inquiryStatus,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating inquiry status: ${error}`);
        next(error);
    }
});
exports.updateInquiryStatus = updateInquiryStatus;
