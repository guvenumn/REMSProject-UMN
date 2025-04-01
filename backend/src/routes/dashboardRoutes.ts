// src/routes/dashboardRoutes.ts
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";
import prisma from "../config/database";
import { ApiError } from "../utils/errors";

const router = Router();

// Get dashboard statistics
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user exists on the request
    if (!req.user || !req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const userId = req.userId;
    logger.info(`Fetching dashboard stats for user ${userId}`);

    // Get counts for different entities
    const [
      propertiesCount,
      conversationsCount,
      inquiriesCount,
      unreadMessagesCount,
    ] = await Promise.all([
      // Count properties
      prisma.property.count({
        where: {
          agentId: userId,
        },
      }),
      // Count conversations
      prisma.conversation.count({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
      }),
      // Count inquiries
      prisma.propertyInquiry.count({
        where: {
          property: {
            agentId: userId,
          },
        },
      }),
      // Count unread messages in conversations
      prisma.conversationParticipant.aggregate({
        where: {
          userId,
          unreadCount: {
            gt: 0,
          },
        },
        _sum: {
          unreadCount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalProperties: propertiesCount,
        totalConversations: conversationsCount,
        totalInquiries: inquiriesCount,
        unreadMessages: unreadMessagesCount._sum?.unreadCount || 0, // Added optional chaining
        // Additional stats can be added here later as needed
        monthlyViews: 0, // Placeholder for now
        recentListings: 0, // Placeholder for now
      },
    });
  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
});

// Get recent activity for dashboard
router.get("/activity", authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user exists on the request
    if (!req.user || !req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info(
      `Fetching dashboard activity for user ${userId}, limit: ${limit}`
    );

    // Get recent messages from conversations
    const recentMessages = await prisma.message.findMany({
      where: {
        conversation: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        conversation: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: limit,
    });

    // Get recent inquiries
    const recentInquiries = await prisma.propertyInquiry.findMany({
      where: {
        property: {
          agentId: userId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Format messages as activity items
    const messageActivities = recentMessages.map((message) => ({
      id: message.id,
      type: "message_received" as const,
      user: {
        id: message.sender.id,
        name: message.sender.name,
        avatarUrl: message.sender.avatarUrl,
      },
      target: message.conversation.property
        ? {
            id: message.conversation.property.id,
            type: "property",
            title: message.conversation.property.title,
          }
        : undefined,
      timestamp: message.sentAt.toISOString(),
      preview:
        message.content.substring(0, 100) +
        (message.content.length > 100 ? "..." : ""),
    }));

    // Format inquiries as activity items
    const inquiryActivities = recentInquiries.map((inquiry) => ({
      id: inquiry.id,
      type: "inquiry_received" as const,
      user: {
        id: inquiry.user.id,
        name: inquiry.user.name,
        avatarUrl: inquiry.user.avatarUrl,
      },
      target: {
        id: inquiry.property.id,
        type: "property",
        title: inquiry.property.title,
      },
      timestamp: inquiry.createdAt.toISOString(),
      preview:
        inquiry.message.substring(0, 100) +
        (inquiry.message.length > 100 ? "..." : ""),
    }));

    // Combine and sort by timestamp (newest first)
    const activities = [...messageActivities, ...inquiryActivities]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error(`Error fetching dashboard activity: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard activity",
    });
  }
});

export default router;
