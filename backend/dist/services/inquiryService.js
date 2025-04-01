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
exports.InquiryService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const messageService_1 = __importDefault(require("./messageService"));
const prisma = new client_1.PrismaClient();
class InquiryService {
    static getInquiries(userId, role, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (filters.page - 1) * filters.limit;
                const where = {};
                if (role === "AGENT") {
                    where.property = { agentId: userId };
                }
                else if (role === "USER") {
                    where.userId = userId;
                }
                if (filters.status) {
                    where.status = filters.status;
                }
                if (filters.search) {
                    where.OR = [
                        {
                            message: {
                                contains: filters.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            property: {
                                title: {
                                    contains: filters.search,
                                    mode: "insensitive",
                                },
                            },
                        },
                        {
                            user: {
                                name: {
                                    contains: filters.search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    ];
                }
                const total = yield prisma.propertyInquiry.count({ where });
                const inquiries = yield prisma.propertyInquiry.findMany({
                    where,
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                agent: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                    },
                                },
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        conversation: {
                            select: {
                                id: true,
                                inquiryStatus: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: filters.limit,
                });
                const formattedInquiries = inquiries.map((inquiry) => {
                    var _a;
                    return ({
                        id: inquiry.id,
                        userId: inquiry.userId,
                        userName: inquiry.user.name,
                        userEmail: inquiry.user.email,
                        propertyId: inquiry.propertyId,
                        propertyTitle: inquiry.property.title,
                        agentId: inquiry.property.agent.id,
                        agentName: inquiry.property.agent.name,
                        message: inquiry.message,
                        status: inquiry.status,
                        createdAt: inquiry.createdAt.toISOString(),
                        respondedAt: inquiry.respondedAt
                            ? inquiry.respondedAt.toISOString()
                            : null,
                        conversationId: inquiry.conversationId,
                        inquiryStatus: ((_a = inquiry.conversation) === null || _a === void 0 ? void 0 : _a.inquiryStatus) || inquiry.status,
                    });
                });
                return {
                    inquiries: formattedInquiries,
                    pagination: {
                        total,
                        page: filters.page,
                        limit: filters.limit,
                        totalPages: Math.ceil(total / filters.limit),
                    },
                };
            }
            catch (error) {
                logger_1.logger.error("Error in InquiryService.getInquiries:", error);
                throw error;
            }
        });
    }
    static getInquiryById(inquiryId, userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const whereClause = { id: inquiryId };
                if (role === "AGENT") {
                    whereClause.property = { agentId: userId };
                }
                else if (role === "USER") {
                    whereClause.userId = userId;
                }
                const inquiry = yield prisma.propertyInquiry.findFirst({
                    where: whereClause,
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                agent: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        conversation: {
                            select: {
                                id: true,
                                inquiryStatus: true,
                            },
                        },
                    },
                });
                if (!inquiry) {
                    throw new errors_1.NotFoundError("Inquiry not found");
                }
                return {
                    id: inquiry.id,
                    userId: inquiry.userId,
                    userName: inquiry.user.name,
                    userEmail: inquiry.user.email,
                    propertyId: inquiry.propertyId,
                    propertyTitle: inquiry.property.title,
                    agentId: inquiry.property.agent.id,
                    agentName: inquiry.property.agent.name,
                    message: inquiry.message,
                    status: inquiry.status,
                    createdAt: inquiry.createdAt.toISOString(),
                    respondedAt: inquiry.respondedAt
                        ? inquiry.respondedAt.toISOString()
                        : null,
                    conversationId: inquiry.conversationId,
                    inquiryStatus: ((_a = inquiry.conversation) === null || _a === void 0 ? void 0 : _a.inquiryStatus) || inquiry.status,
                };
            }
            catch (error) {
                logger_1.logger.error("Error in InquiryService.getInquiryById:", error);
                throw error;
            }
        });
    }
    static createInquiry(userId, propertyId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const property = yield prisma.property.findUnique({
                    where: { id: propertyId },
                    select: {
                        id: true,
                        title: true,
                        agentId: true,
                        agent: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                });
                if (!property) {
                    throw new errors_1.NotFoundError("Property not found");
                }
                const result = yield messageService_1.default.createPropertyInquiry(userId, property.agentId, propertyId, message);
                return {
                    inquiry: result.inquiry,
                    conversation: result.conversation,
                };
            }
            catch (error) {
                logger_1.logger.error("Error in InquiryService.createInquiry:", error);
                throw error;
            }
        });
    }
    static updateInquiryStatus(inquiryId, status, userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inquiry = yield InquiryService.getInquiryById(inquiryId, userId, role);
                if (!inquiry) {
                    throw new errors_1.NotFoundError("Inquiry not found");
                }
                if (role !== "ADMIN" &&
                    (role !== "AGENT" || inquiry.agentId !== userId)) {
                    throw new errors_1.ApiError("You do not have permission to update this inquiry", 403);
                }
                const updatedInquiry = yield messageService_1.default.updateInquiryStatus(inquiryId, status, userId);
                return {
                    id: updatedInquiry.id,
                    status: updatedInquiry.status,
                    respondedAt: updatedInquiry.respondedAt,
                };
            }
            catch (error) {
                logger_1.logger.error("Error in InquiryService.updateInquiryStatus:", error);
                throw error;
            }
        });
    }
    static respondToInquiry(inquiryId, message, userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inquiry = yield InquiryService.getInquiryById(inquiryId, userId, role);
                if (!inquiry) {
                    throw new errors_1.NotFoundError("Inquiry not found");
                }
                if (role !== "ADMIN" &&
                    (role !== "AGENT" || inquiry.agentId !== userId)) {
                    throw new errors_1.ApiError("You do not have permission to respond to this inquiry", 403);
                }
                if (!inquiry.conversationId) {
                    const result = yield messageService_1.default.startConversation(userId, inquiry.userId, message, {
                        propertyId: inquiry.propertyId,
                        title: `Inquiry about ${inquiry.propertyTitle}`,
                        isInquiry: true,
                    });
                    yield prisma.propertyInquiry.update({
                        where: { id: inquiryId },
                        data: {
                            conversationId: result.id,
                            status: "RESPONDED",
                            respondedAt: new Date(),
                        },
                    });
                    return {
                        inquiry: {
                            id: inquiryId,
                            status: "RESPONDED",
                            respondedAt: new Date().toISOString(),
                        },
                        message: {
                            content: message,
                            sentAt: new Date().toISOString(),
                        },
                        conversation: result,
                    };
                }
                else {
                    const sentMessage = yield messageService_1.default.sendMessage(inquiry.conversationId, userId, message);
                    return {
                        inquiry: {
                            id: inquiryId,
                            status: "RESPONDED",
                            respondedAt: new Date().toISOString(),
                        },
                        message: sentMessage,
                        conversationId: inquiry.conversationId,
                    };
                }
            }
            catch (error) {
                logger_1.logger.error("Error in InquiryService.respondToInquiry:", error);
                throw error;
            }
        });
    }
}
exports.InquiryService = InquiryService;
exports.default = InquiryService;
