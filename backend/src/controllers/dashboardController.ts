// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboardService";
import { ApiError } from "../utils/errors";

// Define UserRole enum to match our service
enum UserRole {
  USER = "USER",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

// Define a type for authenticated request with user
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
    email?: string;
    name?: string;
  };
}

/**
 * Get dashboard statistics for the authenticated user
 */
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, role } = req.user;
    const stats = await dashboardService.getDashboardStats(id, role);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity for the authenticated user
 */
export const getRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, role } = req.user;
    const limit = parseInt(req.query.limit as string) || 5;

    const activity = await dashboardService.getRecentActivity(id, role, limit);
    res.json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ApiError("Unauthorized access to admin statistics", 403);
    }

    const stats = await dashboardService.getAdminStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get system status - admin only
 */
export const getSystemStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ApiError("Unauthorized access to system status", 403);
    }

    const status = await dashboardService.getSystemStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
};
