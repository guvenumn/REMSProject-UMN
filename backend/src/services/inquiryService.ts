// src/services/inquiryService.ts
import { PrismaClient, InquiryStatus } from "@prisma/client";
import { ApiError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import MessageService from "./messageService";

const prisma = new PrismaClient();

interface InquiryFilters {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

/**
 * Service for managing property inquiries
 * Uses the MessageService for integrated operations
 */
export class InquiryService {
  /**
   * Get inquiries with pagination and filtering
   * @param userId - User ID
   * @param role - User role (USER, AGENT, ADMIN)
   * @param filters - Filter and pagination options
   */
  static async getInquiries(
    userId: string,
    role: string,
    filters: InquiryFilters
  ) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      // Apply filter based on user role
      if (role === "AGENT") {
        // Agents can only see inquiries for their properties
        where.property = { agentId: userId };
      } else if (role === "USER") {
        // Regular users can only see their own inquiries
        where.userId = userId;
      }
      // Admins can see all inquiries (no additional filter)

      // Apply status filter if provided
      if (filters.status) {
        where.status = filters.status;
      }

      // Apply search filter if provided
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

      // Get total count for pagination
      const total = await prisma.propertyInquiry.count({ where });

      // Get inquiries with related data
      const inquiries = await prisma.propertyInquiry.findMany({
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

      // Transform to expected format
      const formattedInquiries = inquiries.map((inquiry) => ({
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
        // If there's a linked conversation, use its status (it might be more up-to-date)
        inquiryStatus: inquiry.conversation?.inquiryStatus || inquiry.status,
      }));

      return {
        inquiries: formattedInquiries,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    } catch (error) {
      logger.error("Error in InquiryService.getInquiries:", error);
      throw error;
    }
  }

  /**
   * Get an inquiry by ID
   * @param inquiryId - ID of the inquiry
   * @param userId - ID of the requesting user
   * @param role - Role of the requesting user
   */
  static async getInquiryById(inquiryId: string, userId: string, role: string) {
    try {
      const whereClause: any = { id: inquiryId };

      // Apply role-based access control
      if (role === "AGENT") {
        whereClause.property = { agentId: userId };
      } else if (role === "USER") {
        whereClause.userId = userId;
      }
      // Admins can access any inquiry

      const inquiry = await prisma.propertyInquiry.findFirst({
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
        throw new NotFoundError("Inquiry not found");
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
        inquiryStatus: inquiry.conversation?.inquiryStatus || inquiry.status,
      };
    } catch (error) {
      logger.error("Error in InquiryService.getInquiryById:", error);
      throw error;
    }
  }

  /**
   * Create a new property inquiry
   * @param userId - ID of the user making the inquiry
   * @param propertyId - ID of the property being inquired about
   * @param message - Inquiry message
   */
  static async createInquiry(
    userId: string,
    propertyId: string,
    message: string
  ) {
    try {
      // Get the property and its agent
      const property = await prisma.property.findUnique({
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
        throw new NotFoundError("Property not found");
      }

      // Use the MessageService to create an inquiry with an associated conversation
      const result = await MessageService.createPropertyInquiry(
        userId,
        property.agentId,
        propertyId,
        message
      );

      return {
        inquiry: result.inquiry,
        conversation: result.conversation,
      };
    } catch (error) {
      logger.error("Error in InquiryService.createInquiry:", error);
      throw error;
    }
  }

  /**
   * Update the status of an inquiry
   * @param inquiryId - ID of the inquiry
   * @param status - New status
   * @param userId - ID of the user updating the status
   * @param role - Role of the user
   */
  static async updateInquiryStatus(
    inquiryId: string,
    status: InquiryStatus,
    userId: string,
    role: string
  ) {
    try {
      // Check if the inquiry exists and user has access
      const inquiry = await InquiryService.getInquiryById(
        inquiryId,
        userId,
        role
      );

      if (!inquiry) {
        throw new NotFoundError("Inquiry not found");
      }

      // Only agents and admins can update status
      if (
        role !== "ADMIN" &&
        (role !== "AGENT" || inquiry.agentId !== userId)
      ) {
        throw new ApiError(
          "You do not have permission to update this inquiry",
          403
        );
      }

      // Use MessageService to update both the inquiry and any linked conversation
      const updatedInquiry = await MessageService.updateInquiryStatus(
        inquiryId,
        status,
        userId
      );

      return {
        id: updatedInquiry.id,
        status: updatedInquiry.status,
        respondedAt: updatedInquiry.respondedAt,
      };
    } catch (error) {
      logger.error("Error in InquiryService.updateInquiryStatus:", error);
      throw error;
    }
  }

  /**
   * Respond to an inquiry by sending a message and updating status
   * @param inquiryId - ID of the inquiry
   * @param message - Response message
   * @param userId - ID of the user responding
   * @param role - Role of the user
   */
  static async respondToInquiry(
    inquiryId: string,
    message: string,
    userId: string,
    role: string
  ) {
    try {
      // Check if the inquiry exists and user has access
      const inquiry = await InquiryService.getInquiryById(
        inquiryId,
        userId,
        role
      );

      if (!inquiry) {
        throw new NotFoundError("Inquiry not found");
      }

      // Only agents and admins can respond to inquiries
      if (
        role !== "ADMIN" &&
        (role !== "AGENT" || inquiry.agentId !== userId)
      ) {
        throw new ApiError(
          "You do not have permission to respond to this inquiry",
          403
        );
      }

      // Check if there's an associated conversation
      if (!inquiry.conversationId) {
        // Create a conversation if one doesn't exist
        const result = await MessageService.startConversation(
          userId,
          inquiry.userId,
          message,
          {
            propertyId: inquiry.propertyId,
            title: `Inquiry about ${inquiry.propertyTitle}`,
            isInquiry: true,
          }
        );

        // Link the conversation to the inquiry
        await prisma.propertyInquiry.update({
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
      } else {
        // Send a message to the existing conversation
        const sentMessage = await MessageService.sendMessage(
          inquiry.conversationId,
          userId,
          message
        );

        // The MessageService already updates the inquiry status

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
    } catch (error) {
      logger.error("Error in InquiryService.respondToInquiry:", error);
      throw error;
    }
  }
}

export default InquiryService;
