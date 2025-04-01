// src/controllers/messageController.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiError, BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Get all conversations for the current user, with filtering support
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Parse query parameters for filtering
    const isInquiry =
      req.query.isInquiry === "true"
        ? true
        : req.query.isInquiry === "false"
        ? false
        : undefined;
    const status = req.query.status as string | undefined;
    const propertyId = req.query.propertyId as string | undefined;

    // Build the where clause
    let whereClause: any = {
      participants: {
        some: {
          userId: req.userId,
          isActive: true,
        },
      },
      isArchived: false,
    };

    // Add filters if provided
    if (isInquiry !== undefined) {
      whereClause.isInquiry = isInquiry;
    }

    if (status && ["NEW", "RESPONDED", "CLOSED"].includes(status)) {
      whereClause.inquiryStatus = status;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    // Fetch all conversations where the user is a participant, with filters
    const conversations = await prisma.conversation.findMany({
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

    // Transform conversations to a more usable format
    const formattedConversations = conversations.map((conversation) => {
      // Get all participants except the current user
      const otherParticipants = conversation.participants
        .filter((p) => p.userId !== req.userId)
        .map((p) => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          avatarUrl: p.user.avatarUrl,
        }));

      // Get current user participant
      const currentUserParticipant = conversation.participants.find(
        (p) => p.userId === req.userId
      );

      // Get last message content
      const lastMessage = conversation.messages[0] || null;

      // Count unread messages
      let unreadCount = 0;
      if (currentUserParticipant?.lastReadAt) {
        // Count messages after the last read time
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
        title:
          conversation.title ||
          (otherParticipants.length > 0
            ? otherParticipants[0].name
            : "Conversation"),
        participants: [
          // Add current user first
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
        isInquiry: conversation.isInquiry || false, // Add isInquiry flag
        inquiryStatus: conversation.inquiryStatus, // Add inquiry status
      };
    });

    logger.info(
      `Retrieved ${formattedConversations.length} conversations for user ${req.userId}`
    );

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    logger.error(`Error retrieving conversations: ${error}`);
    next(error);
  }
};

/**
 * Update a conversation's inquiry status
 */
export const updateConversationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;
    const { status, isInquiry } = req.body;

    if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
      throw new BadRequestError(
        "Valid status is required (NEW, RESPONDED, CLOSED)"
      );
    }

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Update the conversation's inquiry status
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        inquiryStatus: status,
        isInquiry: isInquiry === true ? true : conversation.isInquiry || false, // Maintain isInquiry flag
      },
    });

    // If the conversation has linked inquiries, update them too
    if (conversation.inquiries && conversation.inquiries.length > 0) {
      await prisma.propertyInquiry.updateMany({
        where: {
          conversationId: id,
        },
        data: {
          status,
          respondedAt: status === "RESPONDED" ? new Date() : undefined,
        },
      });

      logger.info(
        `Updated ${conversation.inquiries.length} linked inquiries to status: ${status}`
      );
    }

    logger.info(
      `Updated conversation ${id} status to ${status} by user ${req.userId}`
    );

    res.status(200).json({
      success: true,
      data: updatedConversation,
    });
  } catch (error) {
    logger.error(`Error updating conversation status: ${error}`);
    next(error);
  }
};

// Rest of my existing controller methods...

/**
 * Get a single conversation by ID
 */
export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Format participants
    const participants = conversation.participants.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      avatarUrl: p.user.avatarUrl,
    }));

    logger.info(`Retrieved conversation ${id} for user ${req.userId}`);

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
  } catch (error) {
    logger.error(`Error retrieving conversation: ${error}`);
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;
    const { limit = "50", before } = req.query;
    const pageSize = parseInt(limit as string) || 50;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Build query for messages
    let whereClause: any = {
      conversationId: id,
    };

    // If 'before' is provided, get messages before that date
    if (before) {
      whereClause.sentAt = {
        lt: new Date(before as string),
      };
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
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

    // Reverse to get chronological order
    const chronologicalMessages = [...messages].reverse();

    logger.info(`Retrieved ${messages.length} messages for conversation ${id}`);

    res.status(200).json({
      success: true,
      data: chronologicalMessages,
      pagination: {
        hasMore: messages.length === pageSize,
        nextCursor:
          messages.length > 0 ? messages[0].sentAt.toISOString() : null,
      },
    });
  } catch (error) {
    logger.error(`Error retrieving messages: ${error}`);
    next(error);
  }
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new BadRequestError("Message content is required");
    }

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Create the message
    const message = await prisma.message.create({
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

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    logger.info(`Sent message to conversation ${id} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      data: message,
    });

    // TODO: Send notifications via WebSocket if implemented
  } catch (error) {
    logger.error(`Error sending message: ${error}`);
    next(error);
  }
};

/**
 * Start a new conversation
 */
export const startConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { recipientId, initialMessage, propertyId, title } = req.body;

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
      // Use existing conversation
      conversationId = existingConversation.id;

      // Reactivate participants if they were inactive
      await prisma.conversationParticipant.updateMany({
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

      logger.info(
        `Using existing conversation ${conversationId} for users ${req.userId} and ${recipientId}`
      );
    } else {
      // Create new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          title,
          propertyId,
          participants: {
            create: [{ userId: req.userId }, { userId: recipientId }],
          },
        },
      });

      conversationId = newConversation.id;
      logger.info(
        `Created new conversation ${conversationId} between users ${req.userId} and ${recipientId}`
      );
    }

    // Send initial message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.userId,
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

    // Get the complete conversation with participants
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

    // Format the response
    const formattedConversation = {
      id: conversation!.id,
      title: conversation!.title,
      participants: conversation!.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        avatarUrl: p.user.avatarUrl,
      })),
      property: conversation!.property,
      createdAt: conversation!.createdAt,
      updatedAt: conversation!.updatedAt,
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

    // TODO: Send notifications via WebSocket if implemented
  } catch (error) {
    logger.error(`Error starting conversation: ${error}`);
    next(error);
  }
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Mark messages as read
    await prisma.message.updateMany({
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

    // Update participant's last read timestamp
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId: req.userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    logger.info(`Marked conversation ${id} as read by user ${req.userId}`);

    res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    logger.error(`Error marking conversation as read: ${error}`);
    next(error);
  }
};

/**
 * Archive a conversation
 */
export const archiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Conversation not found");
    }

    // Set participant as inactive instead of deleting the conversation
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId: req.userId,
      },
      data: {
        isActive: false,
      },
    });

    logger.info(`Archived conversation ${id} for user ${req.userId}`);

    res.status(200).json({
      success: true,
      message: "Conversation archived",
    });
  } catch (error) {
    logger.error(`Error archiving conversation: ${error}`);
    next(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Get all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
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

    // Count total unread messages
    let totalUnread = 0;
    for (const conversation of conversations) {
      const lastReadAt = conversation.participants[0]?.lastReadAt;

      // If there's no lastReadAt, count all messages from others
      if (!lastReadAt) {
        totalUnread += conversation.messages.length;
      } else {
        // Count messages after lastReadAt
        totalUnread += conversation.messages.filter(
          (m) => new Date(m.sentAt) > new Date(lastReadAt)
        ).length;
      }
    }

    logger.info(`User ${req.userId} has ${totalUnread} unread messages`);

    res.status(200).json({
      success: true,
      data: {
        count: totalUnread,
      },
    });
  } catch (error) {
    logger.error(`Error getting unread message count: ${error}`);
    next(error);
  }
};
