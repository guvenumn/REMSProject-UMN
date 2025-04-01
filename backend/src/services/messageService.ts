// src/services/messageService.ts
import { PrismaClient, InquiryStatus } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Service for handling message and inquiry-related operations
 */
export class MessageService {
  /**
   * Get all conversations for a user
   * @param userId - ID of the user
   * @returns List of conversations with metadata
   */
  static async getUserConversations(userId: string) {
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

      // Transform conversations to a more usable format
      return conversations.map((conversation) => {
        // Get all participants except the current user
        const otherParticipants = conversation.participants
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            avatarUrl: p.user.avatarUrl,
          }));

        // Get current user participant
        const currentUserParticipant = conversation.participants.find(
          (p) => p.userId === userId
        );

        // Get last message content
        const lastMessage = conversation.messages[0] || null;

        // Count unread messages
        let unreadCount = currentUserParticipant?.unreadCount || 0;

        return {
          id: conversation.id,
          title:
            conversation.title ||
            (otherParticipants.length > 0
              ? otherParticipants[0].name
              : "Conversation"),
          participants: [
            // Add current user first
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
    } catch (error) {
      logger.error(`Error in MessageService.getUserConversations: ${error}`);
      throw error;
    }
  }

  /**
   * Get details of a specific conversation
   * @param conversationId - ID of the conversation
   * @param userId - ID of the requesting user
   * @returns Conversation details
   */
  static async getConversationDetails(conversationId: string, userId: string) {
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
          inquiries: true,
        },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation not found");
      }

      // Format participants
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
        inquiryId:
          conversation.inquiries.length > 0
            ? conversation.inquiries[0].id
            : null,
      };
    } catch (error) {
      logger.error(`Error in MessageService.getConversationDetails: ${error}`);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * @param conversationId - ID of the conversation
   * @param userId - ID of the requesting user
   * @param options - Pagination options
   * @returns Messages with pagination info
   */
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    options: { limit?: number; before?: string } = {}
  ) {
    try {
      const { limit = 50, before } = options;

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

      // Build query for messages
      let whereClause: any = {
        conversationId: conversationId,
      };

      // If 'before' is provided, get messages before that date
      if (before) {
        whereClause.sentAt = {
          lt: new Date(before),
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

      // Mark messages as read in transaction
      await prisma.$transaction([
        // Update messages as read
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
        // Update participant's last read timestamp and unread count
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
        // Update conversation's total unread count
        prisma.conversation.update({
          where: { id: conversationId },
          data: {
            unreadCount: await prisma.message.count({
              where: {
                conversationId: conversationId,
                isRead: false,
              },
            }),
          },
        }),
      ]);

      // Reverse to get chronological order
      const chronologicalMessages = [...messages].reverse();

      return {
        messages: chronologicalMessages,
        pagination: {
          hasMore: messages.length === limit,
          nextCursor:
            messages.length > 0 ? messages[0].sentAt.toISOString() : null,
        },
      };
    } catch (error) {
      logger.error(`Error in MessageService.getConversationMessages: ${error}`);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   * @param conversationId - ID of the conversation
   * @param userId - ID of the sender
   * @param content - Message content
   * @returns The created message
   */
  static async sendMessage(
    conversationId: string,
    userId: string,
    content: string
  ) {
    try {
      if (!content || !content.trim()) {
        throw new BadRequestError("Message content is required");
      }

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
          participants: true,
        },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation not found");
      }

      // Start a transaction to ensure all updates happen atomically
      return await prisma.$transaction(async (tx) => {
        // Check if this is an inquiry response
        const isInquiryResponse =
          conversation.isInquiry &&
          userId !== conversation.participants[0].userId;

        // Create the message
        const message = await tx.message.create({
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

        // Update all other participants' unread counts
        for (const participant of conversation.participants) {
          if (participant.userId !== userId) {
            await tx.conversationParticipant.update({
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

        // Update conversation timestamp and unread count
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            unreadCount: {
              increment: conversation.participants.length - 1, // All participants except sender
            },
          },
        });

        // If this is an inquiry response, update the inquiry status
        if (isInquiryResponse && conversation.inquiryStatus === "NEW") {
          await tx.conversation.update({
            where: { id: conversationId },
            data: {
              inquiryStatus: "RESPONDED",
            },
          });

          // Also update any linked property inquiries
          await tx.propertyInquiry.updateMany({
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
      });
    } catch (error) {
      logger.error(`Error in MessageService.sendMessage: ${error}`);
      throw error;
    }
  }

  /**
   * Start a new conversation
   * @param userId - ID of the initiating user
   * @param recipientId - ID of the recipient
   * @param initialMessage - First message content
   * @param options - Additional options (property ID, title, isInquiry)
   * @returns The created conversation with initial message
   */
  static async startConversation(
    userId: string,
    recipientId: string,
    initialMessage: string,
    options: { propertyId?: string; title?: string; isInquiry?: boolean } = {}
  ) {
    try {
      const { propertyId, title, isInquiry = false } = options;

      if (!recipientId) {
        throw new BadRequestError("Recipient ID is required");
      }

      if (!initialMessage || !initialMessage.trim()) {
        throw new BadRequestError("Initial message is required");
      }

      // Check if recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        throw new NotFoundError("Recipient not found");
      }

      // Check if conversation already exists between these users
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
            isInquiry ? { isInquiry: true } : {},
          ],
        },
      });

      return await prisma.$transaction(async (tx) => {
        let conversationId;
        let propertyInquiryId;

        if (existingConversation) {
          // Use existing conversation
          conversationId = existingConversation.id;

          // Reactivate participants if they were inactive
          await tx.conversationParticipant.updateMany({
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
          // Create a property inquiry first if this is an inquiry
          if (isInquiry && propertyId) {
            const inquiry = await tx.propertyInquiry.create({
              data: {
                propertyId,
                userId,
                message: initialMessage.trim(),
                status: "NEW",
              },
            });
            propertyInquiryId = inquiry.id;
          }

          // Create new conversation
          const newConversation = await tx.conversation.create({
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

          // Update the property inquiry with the conversation ID
          if (propertyInquiryId) {
            await tx.propertyInquiry.update({
              where: { id: propertyInquiryId },
              data: {
                conversationId: conversationId,
              },
            });
          }
        }

        // Send initial message
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: initialMessage.trim(),
            isRead: false,
          },
        });

        // Update recipient's unread count
        await tx.conversationParticipant.updateMany({
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

        // Update conversation timestamp and unread count
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            unreadCount: 1, // One unread message for the recipient
          },
        });

        // Get the complete conversation with participants
        const conversation = await tx.conversation.findUnique({
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

        // Format the response
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
      });
    } catch (error) {
      logger.error(`Error in MessageService.startConversation: ${error}`);
      throw error;
    }
  }

  /**
   * Mark a conversation as read for a user
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user
   * @returns Success status
   */
  static async markConversationAsRead(conversationId: string, userId: string) {
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

      // Start a transaction for atomic updates
      await prisma.$transaction([
        // Mark messages as read
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

        // Update participant's last read timestamp and reset unread count
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

        // Recalculate conversation's total unread count
        prisma.conversation.update({
          where: { id: conversationId },
          data: {
            unreadCount: await prisma.conversationParticipant
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
    } catch (error) {
      logger.error(`Error in MessageService.markConversationAsRead: ${error}`);
      throw error;
    }
  }

  /**
   * Archive a conversation for a user
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user
   * @returns Success status
   */
  static async archiveConversation(conversationId: string, userId: string) {
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

      // Set participant as inactive instead of deleting the conversation
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
      logger.error(`Error in MessageService.archiveConversation: ${error}`);
      throw error;
    }
  }

  /**
   * Create a property inquiry and associated conversation
   * @param userId - ID of the user creating the inquiry
   * @param agentId - ID of the property agent/recipient
   * @param propertyId - ID of the property
   * @param message - Inquiry message
   * @returns Both the created inquiry and conversation
   */
  static async createPropertyInquiry(
    userId: string,
    agentId: string,
    propertyId: string,
    message: string
  ) {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Create a record in propertyInquiry table
        const inquiry = await tx.propertyInquiry.create({
          data: {
            propertyId,
            userId,
            message,
            status: "NEW",
          },
        });

        // Create a conversation with isInquiry flag
        const conversation = await tx.conversation.create({
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

        // Update the property inquiry with the conversation ID
        await tx.propertyInquiry.update({
          where: { id: inquiry.id },
          data: {
            conversationId: conversation.id,
          },
        });

        // Create the first message
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: message,
            isRead: false,
          },
        });

        // Update recipient's unread count
        await tx.conversationParticipant.update({
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

        // Update conversation unread count
        await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            unreadCount: 1,
          },
        });

        return {
          conversation,
          inquiry,
        };
      });
    } catch (error) {
      logger.error(`Error creating property inquiry: ${error}`);
      throw error;
    }
  }

  /**
   * Update status of an inquiry
   * @param inquiryId - ID of the inquiry
   * @param status - New status
   * @param userId - ID of the user making the update
   * @returns Updated inquiry
   */
  static async updateInquiryStatus(
    inquiryId: string,
    status: InquiryStatus,
    userId: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the inquiry
        const inquiry = await tx.propertyInquiry.findUnique({
          where: { id: inquiryId },
          include: {
            conversation: true,
          },
        });

        if (!inquiry) {
          throw new NotFoundError("Inquiry not found");
        }

        // Update the property inquiry
        const updatedInquiry = await tx.propertyInquiry.update({
          where: { id: inquiryId },
          data: {
            status,
            respondedAt:
              status === "RESPONDED" && inquiry.status !== "RESPONDED"
                ? new Date()
                : undefined,
          },
        });

        // Also update the conversation inquiry status if there is one
        if (inquiry.conversationId) {
          await tx.conversation.update({
            where: { id: inquiry.conversationId },
            data: { inquiryStatus: status },
          });
        }

        return updatedInquiry;
      });
    } catch (error) {
      logger.error(`Error updating inquiry status: ${error}`);
      throw error;
    }
  }

  /**
   * Get all communications for a user (messages and inquiries)
   * @param userId - ID of the user
   * @returns Combined list of conversations and inquiries
   */
  static async getAllCommunications(userId: string) {
    try {
      // Get conversations with inquiry information
      const conversations = await prisma.conversation.findMany({
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

      // Get standalone inquiries (those without conversations)
      const standaloneInquiries = await prisma.propertyInquiry.findMany({
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
    } catch (error) {
      logger.error(`Error fetching all communications: ${error}`);
      throw error;
    }
  }

  /**
   * Get the count of unread messages for a user
   * @param userId - ID of the user
   * @returns Number of unread messages
   */
  static async getUnreadMessageCount(userId: string) {
    try {
      // Get sum of unread counts from participant records
      const unreadCounts = await prisma.conversationParticipant.aggregate({
        where: {
          userId,
          isActive: true,
        },
        _sum: {
          unreadCount: true,
        },
      });

      return unreadCounts._sum.unreadCount || 0;
    } catch (error) {
      logger.error(`Error in MessageService.getUnreadMessageCount: ${error}`);
      throw error;
    }
  }
}

export default MessageService;
