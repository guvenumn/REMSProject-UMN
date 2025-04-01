// /var/www/rems/backend/src/websocket/index.ts
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import config from '../config';

// Track active connections
const activeConnections = new Map();

/**
 * Initialize Socket.IO server
 * @param app Express application
 * @param server HTTP server
 */
export function initializeSocketServer(app: express.Application, server: http.Server) {
  try {
    // Create Socket.IO server with CORS options
    const io = new Server(server, {
      cors: config.socket.cors,
      pingTimeout: config.socket?.pingTimeout || 60000,
      pingInterval: config.socket?.pingInterval || 25000,
    });
    
    logger.info('Socket.IO server initialized');
    
    // Auth middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          logger.warn('Socket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }
        
        // Log the token format for debugging (but hide most of it)
        const tokenPreview = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'none';
        logger.info(`Socket auth attempt with token: ${tokenPreview}`);
        
        try {
          // Verify JWT token
          const decoded = jwt.verify(token, config.auth.jwtSecret);
          
          // Extract userId from the decoded token
          let userId = null;
          
          // Handle different token formats
          if (typeof decoded === 'object') {
            // Check all possible userId field names in the token
            userId = decoded.userId || decoded.sub || decoded.id;
            
            // Log the decoded token structure to help debug
            logger.info(`Token payload structure: ${Object.keys(decoded).join(', ')}`);
          }
          
          if (!userId) {
            logger.warn('Socket connection rejected: No userId found in token');
            return next(new Error('Authentication error: Invalid user information in token'));
          }
          
          logger.info(`Socket auth - found user ID: ${userId}`);
          
          // Fetch user from database
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user) {
            logger.warn(`Socket connection rejected: User ${userId} not found`);
            return next(new Error('Authentication error: User not found'));
          }
          
          if (!user.active) {
            logger.warn(`Socket connection rejected: User ${userId} is inactive`);
            return next(new Error('Authentication error: User account is inactive'));
          }
          
          // Attach user data to socket
          socket.data.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
          
          logger.info(`Socket auth successful for user: ${userId}`);
          next();
        } catch (error) {
          // Handle JWT verification errors
          logger.error(`JWT verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return next(new Error('Authentication error: Invalid token'));
        }
      } catch (error) {
        logger.error(`Socket authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        next(new Error('Authentication failed'));
      }
    });
    
    io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      logger.info(`Socket connected: User ${userId} (${socket.id})`);
      
      // Track this connection
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId).add(socket.id);
      
      // Join user's personal room for direct messages
      socket.join(`user:${userId}`);
      
      // Handle joining a conversation
      socket.on('joinConversation', async (conversationId) => {
        try {
          if (!conversationId) return;
          
          // Check if user is participant in this conversation
          const participant = await prisma.conversationParticipant.findUnique({
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
          
          // Join the conversation room
          socket.join(`conversation:${conversationId}`);
          logger.info(`User ${userId} joined conversation ${conversationId}`);
          
          // Mark conversation as read
          await prisma.conversationParticipant.update({
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
        } catch (error) {
          logger.error(`Error joining conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });
      
      // Handle leaving a conversation
      socket.on('leaveConversation', (conversationId) => {
        if (!conversationId) return;
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userId} left conversation ${conversationId}`);
      });
      
      // Handle sending a message
      socket.on('sendMessage', async (data) => {
        try {
          const { conversationId, content, tempId } = data;
          if (!conversationId || !content) {
            socket.emit('error', { 
              message: 'Invalid message data',
              tempId
            });
            return;
          }
          
          // Check if user is participant in this conversation
          const participant = await prisma.conversationParticipant.findUnique({
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
          
          // Create the message in the database
          const message = await prisma.message.create({
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
          
          // Update conversation's updatedAt timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });
          
          // Update unread counts for other participants
          await prisma.conversationParticipant.updateMany({
            where: {
              conversationId,
              userId: { not: userId }
            },
            data: {
              unreadCount: { increment: 1 }
            }
          });
          
          // Format the message for the client
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
          
          // Emit to the conversation room
          io.to(`conversation:${conversationId}`).emit('newMessage', formattedMessage);
          
          // Get other participants to notify them if they're not in the conversation room
          const otherParticipants = await prisma.conversationParticipant.findMany({
            where: {
              conversationId,
              userId: { not: userId }
            },
            select: {
              userId: true
            }
          });
          
          // Get conversation details for the notification
          const conversation = await prisma.conversation.findUnique({
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
          
          // Send notification to other participants
          for (const participant of otherParticipants) {
            io.to(`user:${participant.userId}`).emit('messageNotification', {
              message: formattedMessage,
              conversation: {
                id: conversationId,
                title: conversation?.title || 'New Message',
                property: conversation?.property
              }
            });
          }
          
          // Confirm message sent to the sender with tempId for client-side matching
          socket.emit('messageSent', {
            tempId,
            message: formattedMessage
          });
        } catch (error) {
          logger.error(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
          socket.emit('error', { 
            message: 'Failed to send message',
            tempId: data.tempId
          });
        }
      });
      
      // Handle typing indicator
      socket.on('typing', (conversationId) => {
        socket.to(`conversation:${conversationId}`).emit('userTyping', {
          userId,
          conversationId,
          name: socket.data.user.name
        });
      });
      
      // Handle stop typing
      socket.on('stopTyping', (conversationId) => {
        socket.to(`conversation:${conversationId}`).emit('userStoppedTyping', {
          userId,
          conversationId
        });
      });
      
      // Handle read receipts
      socket.on('markAsRead', async (conversationId) => {
        try {
          // Update the participant's lastReadAt and unreadCount
          await prisma.conversationParticipant.update({
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
          
          // Emit to the conversation room that user has read the messages
          socket.to(`conversation:${conversationId}`).emit('messagesRead', {
            userId,
            conversationId,
            timestamp: new Date()
          });
        } catch (error) {
          logger.error(`Error marking messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: User ${userId} (${socket.id})`);
        
        // Remove from active connections
        if (activeConnections.has(userId)) {
          const userConnections = activeConnections.get(userId);
          userConnections.delete(socket.id);
          
          if (userConnections.size === 0) {
            activeConnections.delete(userId);
          }
        }
      });
    });
    
    // Make io accessible to the rest of the application via app.locals
    app.locals.io = io;
    
    return io;
  } catch (error) {
    logger.error(`Failed to initialize Socket.IO server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Emit an event to a specific user
 * @param userId The user ID to emit to
 * @param event The event name
 * @param data The data to send
 */
export function emitToUser(userId: string, event: string, data: any) {
  const app = global as any; // Avoid TypeScript error by using type assertion
  const io = app.app?.locals?.io;
  
  if (!io) {
    logger.error('Socket.IO not initialized, cannot emit event');
    return;
  }
  
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit an event to a conversation
 * @param conversationId The conversation ID to emit to
 * @param event The event name
 * @param data The data to send
 */
export function emitToConversation(conversationId: string, event: string, data: any) {
  const app = global as any; // Avoid TypeScript error by using type assertion
  const io = app.app?.locals?.io;
  
  if (!io) {
    logger.error('Socket.IO not initialized, cannot emit event');
    return;
  }
  
  io.to(`conversation:${conversationId}`).emit(event, data);
}

/**
 * Check if a user is online
 * @param userId The user ID to check
 * @returns Boolean indicating if user is online
 */
export function isUserOnline(userId: string): boolean {
  return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
}
