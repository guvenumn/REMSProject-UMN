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
exports.initializeSocketServer = initializeSocketServer;
exports.emitToUser = emitToUser;
exports.emitToConversation = emitToConversation;
exports.isUserOnline = isUserOnline;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const activeConnections = new Map();
function initializeSocketServer(app, server) {
    var _a, _b;
    try {
        const io = new socket_io_1.Server(server, {
            cors: config_1.default.socket.cors,
            pingTimeout: ((_a = config_1.default.socket) === null || _a === void 0 ? void 0 : _a.pingTimeout) || 60000,
            pingInterval: ((_b = config_1.default.socket) === null || _b === void 0 ? void 0 : _b.pingInterval) || 25000,
        });
        logger_1.logger.info('Socket.IO server initialized');
        io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    logger_1.logger.warn('Socket connection rejected: No token provided');
                    return next(new Error('Authentication error: No token provided'));
                }
                const tokenPreview = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'none';
                logger_1.logger.info(`Socket auth attempt with token: ${tokenPreview}`);
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
                    let userId = null;
                    if (typeof decoded === 'object') {
                        userId = decoded.userId || decoded.sub || decoded.id;
                        logger_1.logger.info(`Token payload structure: ${Object.keys(decoded).join(', ')}`);
                    }
                    if (!userId) {
                        logger_1.logger.warn('Socket connection rejected: No userId found in token');
                        return next(new Error('Authentication error: Invalid user information in token'));
                    }
                    logger_1.logger.info(`Socket auth - found user ID: ${userId}`);
                    const user = yield database_1.prisma.user.findUnique({
                        where: { id: userId }
                    });
                    if (!user) {
                        logger_1.logger.warn(`Socket connection rejected: User ${userId} not found`);
                        return next(new Error('Authentication error: User not found'));
                    }
                    if (!user.active) {
                        logger_1.logger.warn(`Socket connection rejected: User ${userId} is inactive`);
                        return next(new Error('Authentication error: User account is inactive'));
                    }
                    socket.data.user = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                    logger_1.logger.info(`Socket auth successful for user: ${userId}`);
                    next();
                }
                catch (error) {
                    logger_1.logger.error(`JWT verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return next(new Error('Authentication error: Invalid token'));
                }
            }
            catch (error) {
                logger_1.logger.error(`Socket authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                next(new Error('Authentication failed'));
            }
        }));
        io.on('connection', (socket) => {
            const userId = socket.data.user.id;
            logger_1.logger.info(`Socket connected: User ${userId} (${socket.id})`);
            if (!activeConnections.has(userId)) {
                activeConnections.set(userId, new Set());
            }
            activeConnections.get(userId).add(socket.id);
            socket.join(`user:${userId}`);
            socket.on('joinConversation', (conversationId) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!conversationId)
                        return;
                    const participant = yield database_1.prisma.conversationParticipant.findUnique({
                        where: {
                            conversationId_userId: {
                                conversationId,
                                userId
                            }
                        }
                    });
                    if (!participant) {
                        socket.emit('error', {
                            message: 'Not authorized to join this conversation'
                        });
                        return;
                    }
                    socket.join(`conversation:${conversationId}`);
                    logger_1.logger.info(`User ${userId} joined conversation ${conversationId}`);
                    yield database_1.prisma.conversationParticipant.update({
                        where: {
                            conversationId_userId: {
                                conversationId,
                                userId
                            }
                        },
                        data: {
                            lastReadAt: new Date(),
                            unreadCount: 0
                        }
                    });
                    socket.emit('conversationJoined', { conversationId });
                }
                catch (error) {
                    logger_1.logger.error(`Error joining conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    socket.emit('error', { message: 'Failed to join conversation' });
                }
            }));
            socket.on('leaveConversation', (conversationId) => {
                if (!conversationId)
                    return;
                socket.leave(`conversation:${conversationId}`);
                logger_1.logger.info(`User ${userId} left conversation ${conversationId}`);
            });
            socket.on('sendMessage', (data) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { conversationId, content, tempId } = data;
                    if (!conversationId || !content) {
                        socket.emit('error', {
                            message: 'Invalid message data',
                            tempId
                        });
                        return;
                    }
                    const participant = yield database_1.prisma.conversationParticipant.findUnique({
                        where: {
                            conversationId_userId: {
                                conversationId,
                                userId
                            }
                        }
                    });
                    if (!participant) {
                        socket.emit('error', {
                            message: 'Not authorized to send messages in this conversation',
                            tempId
                        });
                        return;
                    }
                    const message = yield database_1.prisma.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            content,
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    });
                    yield database_1.prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() }
                    });
                    yield database_1.prisma.conversationParticipant.updateMany({
                        where: {
                            conversationId,
                            userId: { not: userId }
                        },
                        data: {
                            unreadCount: { increment: 1 }
                        }
                    });
                    const formattedMessage = {
                        id: message.id,
                        conversationId: message.conversationId,
                        senderId: message.senderId,
                        content: message.content,
                        isRead: message.isRead,
                        sentAt: message.sentAt,
                        readAt: message.readAt,
                        sender: message.sender
                    };
                    io.to(`conversation:${conversationId}`).emit('newMessage', formattedMessage);
                    const otherParticipants = yield database_1.prisma.conversationParticipant.findMany({
                        where: {
                            conversationId,
                            userId: { not: userId }
                        },
                        select: {
                            userId: true
                        }
                    });
                    const conversation = yield database_1.prisma.conversation.findUnique({
                        where: { id: conversationId },
                        include: {
                            property: {
                                select: {
                                    id: true,
                                    title: true,
                                    images: {
                                        take: 1,
                                        select: {
                                            url: true
                                        }
                                    }
                                }
                            }
                        }
                    });
                    for (const participant of otherParticipants) {
                        io.to(`user:${participant.userId}`).emit('messageNotification', {
                            message: formattedMessage,
                            conversation: {
                                id: conversationId,
                                title: (conversation === null || conversation === void 0 ? void 0 : conversation.title) || 'New Message',
                                property: conversation === null || conversation === void 0 ? void 0 : conversation.property
                            }
                        });
                    }
                    socket.emit('messageSent', {
                        tempId,
                        message: formattedMessage
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    socket.emit('error', {
                        message: 'Failed to send message',
                        tempId: data.tempId
                    });
                }
            }));
            socket.on('typing', (conversationId) => {
                socket.to(`conversation:${conversationId}`).emit('userTyping', {
                    userId,
                    conversationId,
                    name: socket.data.user.name
                });
            });
            socket.on('stopTyping', (conversationId) => {
                socket.to(`conversation:${conversationId}`).emit('userStoppedTyping', {
                    userId,
                    conversationId
                });
            });
            socket.on('markAsRead', (conversationId) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield database_1.prisma.conversationParticipant.update({
                        where: {
                            conversationId_userId: {
                                conversationId,
                                userId
                            }
                        },
                        data: {
                            lastReadAt: new Date(),
                            unreadCount: 0
                        }
                    });
                    socket.to(`conversation:${conversationId}`).emit('messagesRead', {
                        userId,
                        conversationId,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Error marking messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }));
            socket.on('disconnect', () => {
                logger_1.logger.info(`Socket disconnected: User ${userId} (${socket.id})`);
                if (activeConnections.has(userId)) {
                    const userConnections = activeConnections.get(userId);
                    userConnections.delete(socket.id);
                    if (userConnections.size === 0) {
                        activeConnections.delete(userId);
                    }
                }
            });
        });
        app.locals.io = io;
        return io;
    }
    catch (error) {
        logger_1.logger.error(`Failed to initialize Socket.IO server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
function emitToUser(userId, event, data) {
    var _a, _b;
    const app = global;
    const io = (_b = (_a = app.app) === null || _a === void 0 ? void 0 : _a.locals) === null || _b === void 0 ? void 0 : _b.io;
    if (!io) {
        logger_1.logger.error('Socket.IO not initialized, cannot emit event');
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
}
function emitToConversation(conversationId, event, data) {
    var _a, _b;
    const app = global;
    const io = (_b = (_a = app.app) === null || _a === void 0 ? void 0 : _a.locals) === null || _b === void 0 ? void 0 : _b.io;
    if (!io) {
        logger_1.logger.error('Socket.IO not initialized, cannot emit event');
        return;
    }
    io.to(`conversation:${conversationId}`).emit(event, data);
}
function isUserOnline(userId) {
    return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
}
