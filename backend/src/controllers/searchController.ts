// Path: /backend/src/controllers/searchController.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Search for users, properties, or both
 */
export const searchAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.query as string;
    const type = (req.query.type as string) || "all";
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      res.status(200).json({
        success: true,
        data: { users: [], properties: [], total: 0 },
      });
      return;
    }

    // Initialize results with explicit types
    const users: any[] = [];
    const properties: any[] = [];
    let total = 0;

    // Search for users if requested
    if (type === "users" || type === "all") {
      const foundUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
        take: limit,
      });

      // Add found users to our result array
      users.push(...foundUsers);
      total += foundUsers.length;
    }

    // Search for properties if requested
    if (type === "properties" || type === "all") {
      const foundProperties = await prisma.property.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          propertyType: true,
          images: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
        take: limit,
      });

      // Add found properties to our result array
      properties.push(...foundProperties);
      total += foundProperties.length;
    }

    logger.info(`Search query "${query}" returned ${total} results`);

    // Return results based on type
    if (type === "users") {
      res.status(200).json({
        success: true,
        data: { users, total: users.length },
      });
    } else if (type === "properties") {
      res.status(200).json({
        success: true,
        data: { properties, total: properties.length },
      });
    } else {
      res.status(200).json({
        success: true,
        data: { users, properties, total },
      });
    }
  } catch (error) {
    logger.error(`Error during search: ${error}`);
    next(error);
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return searchAll(req, res, next);
};

export const searchProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return searchAll(req, res, next);
};
