// src/services/dashboardService.ts
import { PrismaClient } from "@prisma/client";
import { UserRole } from "../types/user";
import { ApiError } from "../utils/errors";

const prisma = new PrismaClient();

/**
 * Dashboard activity item interface
 */
interface ActivityItem {
  id: string;
  action: string;
  property: string;
  time: string;
  meta?: Record<string, any>;
}

/**
 * Get dashboard statistics for a specific user
 */
export const getDashboardStats = async (userId: string, role: UserRole) => {
  try {
    // For regular users, return their own stats
    if (role === "USER") {
      const savedProperties = await prisma.savedProperty.count({
        where: { userId },
      });

      const savedSearches = await prisma.savedSearch.count({
        where: { userId },
      });

      const inquiries = await prisma.propertyInquiry.count({
        where: { userId },
      });

      return {
        savedProperties,
        savedSearches,
        inquiries,
        // Users don't have properties
        totalProperties: 0,
        activeListings: 0,
        newInquiries: 0,
      };
    }

    // For agents, return their property stats
    const totalProperties = await prisma.property.count({
      where: { agentId: userId },
    });

    const activeListings = await prisma.property.count({
      where: {
        agentId: userId,
        status: { in: ["AVAILABLE", "PENDING"] },
      },
    });

    const newInquiries = await prisma.propertyInquiry.count({
      where: {
        property: { agentId: userId },
        status: "NEW",
      },
    });

    const savedSearches = await prisma.savedSearch.count({
      where: { userId },
    });

    return {
      totalProperties,
      activeListings,
      newInquiries,
      savedSearches,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw new ApiError("Failed to get dashboard statistics", 500);
  }
};

/**
 * Get recent activity for a user
 */
export const getRecentActivity = async (
  userId: string,
  role: UserRole,
  limit: number = 5
) => {
  try {
    const activities: ActivityItem[] = [];

    // If user is an agent, get property-related activities
    if (role === "AGENT") {
      // Get recent inquiries for their properties
      const inquiries = await prisma.propertyInquiry.findMany({
        where: {
          property: { agentId: userId },
        },
        include: {
          property: {
            select: {
              title: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      inquiries.forEach((inquiry) => {
        activities.push({
          id: inquiry.id,
          action: "New inquiry received",
          property: inquiry.property.title,
          time: inquiry.createdAt.toISOString(),
          meta: {
            inquiryId: inquiry.id,
            userName: inquiry.user.name,
          },
        });
      });

      // Get recent property views (would require a PropertyView model)
      // This is just an example - you'd need to implement this table
      /*
      const propertyViews = await prisma.propertyView.findMany({
        where: {
          property: { agentId: userId }
        },
        include: {
          property: true,
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      propertyViews.forEach(view => {
        activities.push({
          id: view.id,
          action: 'Property viewed',
          property: view.property.title,
          time: view.createdAt.toISOString()
        });
      });
      */
    }

    // For all users, get their saved properties
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    savedProperties.forEach((saved) => {
      activities.push({
        id: saved.id,
        action: "Property saved",
        property: saved.property.title,
        time: saved.createdAt.toISOString(),
      });
    });

    // Sort by time and limit
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    throw new ApiError("Failed to get recent activity", 500);
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async () => {
  try {
    const [totalUsers, totalAgents, totalProperties, activeListings] =
      await Promise.all([
        prisma.user.count({
          where: { role: "USER" },
        }),
        prisma.user.count({
          where: { role: "AGENT" },
        }),
        prisma.property.count(),
        prisma.property.count({
          where: { status: { in: ["AVAILABLE", "PENDING"] } },
        }),
      ]);

    return {
      totalUsers,
      totalAgents,
      totalProperties,
      activeListings,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw new ApiError("Failed to get admin statistics", 500);
  }
};

/**
 * Get system status - simplified for demo
 * In a real application, you would ping services or check health endpoints
 */
export const getSystemStatus = async () => {
  try {
    // This is a simplified implementation
    // In a real application, you would have actual checks
    return {
      api: "operational",
      database: "operational",
      storage: "operational",
      auth: "operational",
    };
  } catch (error) {
    console.error("Error checking system status:", error);
    throw new ApiError("Failed to check system status", 500);
  }
};
