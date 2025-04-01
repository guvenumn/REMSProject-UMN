// Path: /backend/src/controllers/inquiryFunctions.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiError, BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import { UserRole } from "../types/user"; // Import UserRole type

// We don't need to define AuthenticatedRequest since it's already defined in Express types
// Just use the built-in Request type which already has our custom properties

const prisma = new PrismaClient();

/**
 * Create a property inquiry
 * This function creates both a conversation with isInquiry=true and the first message
 */
export const createPropertyInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { propertyId, message, subject } = req.body;

    if (!propertyId) {
      throw new BadRequestError("Property ID is required");
    }

    if (!message || !message.trim()) {
      throw new BadRequestError("Message content is required");
    }

    // First get the property to find the agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        agentId: true,
      },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Store userId for TypeScript type narrowing
    const userId = req.userId;

    // Create conversation with isInquiry flag
    const conversation = await prisma.conversation.create({
      data: {
        title:
          subject || `Inquiry about property: ${property.title || propertyId}`,
        propertyId,
        isInquiry: true,
        inquiryStatus: "NEW",
        participants: {
          create: [
            { userId: userId }, // Customer
            { userId: property.agentId }, // Agent
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

    // Create the initial message
    const firstMessage = await prisma.message.create({
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

    // Update unread count for the agent
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: property.agentId,
      },
      data: {
        unreadCount: 1,
      },
    });

    // Update conversation's unread count
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        unreadCount: 1,
      },
    });

    logger.info(
      `Created property inquiry from user ${userId} for property ${propertyId}`
    );

    // Format response
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
  } catch (error) {
    logger.error(`Error creating property inquiry: ${error}`);
    next(error);
  }
};

/**
 * Update the status of an inquiry conversation
 */
export const updateInquiryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
      throw new BadRequestError(
        "Valid status is required (NEW, RESPONDED, or CLOSED)"
      );
    }

    // Check if conversation exists, is an inquiry, and user is a participant
    const conversation = await prisma.conversation.findFirst({
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
      throw new NotFoundError("Inquiry conversation not found");
    }

    // Store userId for TypeScript type narrowing
    const userId = req.userId;

    // Only agent can update status
    if (conversation.property?.agentId !== userId) {
      throw new ApiError(
        "Only the property agent can update inquiry status",
        403
      );
    }

    // Update the conversation status
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        inquiryStatus: status,
        updatedAt: new Date(),
      },
    });

    logger.info(
      `Updated inquiry status to ${status} for conversation ${id} by user ${userId}`
    );

    res.status(200).json({
      id: updatedConversation.id,
      inquiryStatus: updatedConversation.inquiryStatus,
    });
  } catch (error) {
    logger.error(`Error updating inquiry status: ${error}`);
    next(error);
  }
};
