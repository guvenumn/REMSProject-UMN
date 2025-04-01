// src/models/messageModel.ts
import prisma from "../config/database";
import { logger } from "../utils/logger";
import { NotFoundError } from "../utils/errors";

/**
 * Message model class for encapsulating message-related database operations
 */
export class MessageModel {
  /**
   * Get user's conversations
   */
  static async getConversations(userId: string) {
    try {
      // Fetch all conversations where the user is a participant
      const conversations = await prisma.conversation.findMany({
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
    } catch (error) {
      logger.error(`Error in MessageModel.getConversations: ${error}`);
      throw error;
    }
  }

  /**
   * Get a single conversation
   */
  static async getConversation(conversationId: string, userId: string) {
    try {
      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
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
        throw new NotFoundError("Conversation not found");
      }

      return conversation;
    } catch (error) {
      logger.error(`Error in MessageModel.getConversation: ${error}`);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    userId: string,
    options: { limit?: number; before?: Date } = {}
  ) {
    try {
      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
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
        throw new NotFoundError("Conversation not found");
      }

      // Build query
      const { limit = 50, before } = options;

      let whereClause: any = {
        conversationId: conversationId,
      };

      if (before) {
        whereClause.sentAt = {
          lt: before,
        };
      }

      // Fetch messages
      const messages = await prisma.message.findMany({
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
    } catch (error) {
      logger.error(`Error in MessageModel.getMessages: ${error}`);
      throw error;
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    userId: string,
    content: string
  ) {
    try {
      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
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
        throw new NotFoundError("Conversation not found");
      }

      // Create the message
      const message = await prisma.message.create({
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

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    } catch (error) {
      logger.error(`Error in MessageModel.sendMessage: ${error}`);
      throw error;
    }
  }

  /**
   * Start a new conversation or use existing
   */
  static async startConversation(
    userId: string,
    recipientId: string,
    initialMessage: string,
    options: { propertyId?: string; title?: string } = {}
  ) {
    try {
      const { propertyId, title } = options;

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
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
        // Use existing conversation
        conversationId = existingConversation.id;

        // Reactivate participants if needed
        await prisma.conversationParticipant.updateMany({
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
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
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

      // Send initial message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: initialMessage.trim(),
          isRead: false,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Get the complete conversation
      const conversation = await prisma.conversation.findUnique({
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
    } catch (error) {
      logger.error(`Error in MessageModel.startConversation: ${error}`);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   */
  static async markAsRead(conversationId: string, userId: string) {
    try {
      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
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
        throw new NotFoundError("Conversation not found");
      }

      // Mark messages as read
      await prisma.message.updateMany({
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

      // Update participant's last read timestamp
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversationId,
          userId: userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error(`Error in MessageModel.markAsRead: ${error}`);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  static async archive(conversationId: string, userId: string) {
    try {
      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
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
        throw new NotFoundError("Conversation not found");
      }

      // Set participant as inactive
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversationId,
          userId: userId,
        },
        data: {
          isActive: false,
        },
      });

      return true;
    } catch (error) {
      logger.error(`Error in MessageModel.archive: ${error}`);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId: string) {
    try {
      // Get all conversations where the user is a participant
      const userParticipations = await prisma.conversationParticipant.findMany({
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

      // Count total unread messages
      let totalUnread = 0;

      for (const participation of userParticipations) {
        if (participation.lastReadAt) {
          // Count messages after lastReadAt
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: participation.conversationId,
              senderId: { not: userId },
              sentAt: { gt: participation.lastReadAt },
            },
          });
          totalUnread += unreadCount;
        } else {
          // If no lastReadAt, count all messages from others
          totalUnread += participation.conversation.messages.length;
        }
      }

      return totalUnread;
    } catch (error) {
      logger.error(`Error in MessageModel.getUnreadCount: ${error}`);
      throw error;
    }
  }
}

export default MessageModel;
