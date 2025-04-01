// Path: /backend/src/controllers/propertyController.ts
import { Request, Response, NextFunction } from "express";
import {
  PrismaClient,
  Prisma,
  PropertyStatus,
  PropertyType,
  ListingType,
  PriceChangeReason,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import config from "../config";
import { ApiError, NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import { UserRole } from "../types/user";

// Remove the declaration here since it should be defined elsewhere
// Using multiple declarations with different types causes the error

// Initialize prisma client
let prisma: PrismaClient;

// Handle Prisma initialization
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Failed to initialize Prisma client:", error);
  // Use a lazy initialization approach
  prisma = null as unknown as PrismaClient;
}

// Function to get or initialize prisma client
const getPrismaClient = () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      console.error("Failed to initialize Prisma client:", error);
      throw new ApiError("Database connection error", 500);
    }
  }
  return prisma;
};

// ----------------------
// Configuration
// ----------------------

const uploadConfig = {
  ...config.upload,
  // Add fallbacks for missing properties
  propertiesDir:
    (config.upload as any).propertiesDir ||
    path.join(process.cwd(), "uploads/properties"),
  allowedImageTypes: (config.upload as any).allowedImageTypes || [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  maxFiles: (config.upload as any).maxFiles || 10,
};

// ----------------------
// Helper Functions
// ----------------------

/**
 * Create a price history entry for a property
 */
const createPriceHistoryEntry = async (
  propertyId: string,
  price: number,
  previousPrice: number | null,
  userId: string,
  reason: PriceChangeReason = "INITIAL_LISTING",
  notes?: string
) => {
  return getPrismaClient().priceHistory.create({
    data: {
      propertyId,
      price,
      previousPrice,
      reason,
      notes,
      createdById: userId,
      date: new Date(), // Ensure we always set the current date
    },
  });
};

/**
 * Format a price history record for frontend display
 */
const formatPriceHistoryRecord = (history: any) => {
  let event = "Price update";

  switch (history.reason) {
    case "INITIAL_LISTING":
      event = "Initially listed";
      break;
    case "PRICE_REDUCTION":
      event = "Price reduced";
      break;
    case "PRICE_INCREASE":
      event = "Price increased";
      break;
    case "RELISTING":
      event = "Relisted";
      break;
    case "MARKET_ADJUSTMENT":
      event = "Market adjustment";
      break;
    default:
      event = history.notes || "Price update";
  }

  return {
    id: history.id,
    date: history.date.toISOString(),
    price: Number(history.price),
    previousPrice: history.previousPrice
      ? Number(history.previousPrice)
      : undefined,
    event,
    createdBy: history.createdBy,
    notes: history.notes,
    reason: history.reason,
  };
};

/**
 * Verify user is authorized to modify a property
 */
const verifyPropertyAccess = async (
  propertyId: string,
  userId: string,
  userRole?: UserRole,
  errorMessage = "Not authorized to perform this action"
) => {
  const property = await getPrismaClient().property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new NotFoundError("Property not found");
  }

  const isAuthorized = property.agentId === userId || userRole === "ADMIN";

  if (!isAuthorized) {
    throw new ApiError(errorMessage, 403);
  }

  return property;
};

// ----------------------
// Property Search Controllers
// ----------------------

/**
 * Search properties by location
 * GET /api/properties/search
 */
export const searchProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      location,
      page = "1",
      limit = "10",
      status,
      propertyType,
      listingType,
    } = req.query;

    logger.info(
      `Property search: location=${location}, status=${status}, propertyType=${propertyType}, listingType=${listingType}, page=${page}, limit=${limit}`
    );

    // Validate location is provided
    if (!location || typeof location !== "string" || !location.trim()) {
      logger.warn("Search attempted without location parameter");
      res.status(400).json({
        success: false,
        error: "Location is required for searching",
        data: [],
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total: 0,
          totalPages: 0,
        },
      });
      return;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const filter: any = {
      OR: [
        { location: { contains: location, mode: "insensitive" } },
        { address: { contains: location, mode: "insensitive" } },
      ],
    };

    // Add filters if provided and valid
    if (
      status &&
      Object.values(PropertyStatus).includes(status as PropertyStatus)
    ) {
      filter.status = status;
    }

    if (
      propertyType &&
      Object.values(PropertyType).includes(propertyType as PropertyType)
    ) {
      filter.propertyType = propertyType;
    }

    if (
      listingType &&
      Object.values(ListingType).includes(listingType as ListingType)
    ) {
      filter.listingType = listingType;
    }

    // Get total count for pagination
    const total = await getPrismaClient().property.count({
      where: filter,
    });

    // Get properties with pagination
    const properties = await getPrismaClient().property.findMany({
      skip,
      take: limitNum,
      where: filter,
      orderBy: {
        createdAt: "desc", // Most recent properties first
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        images: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 2,
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    // Send success response
    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });

    logger.info(
      `Property search complete: found ${properties.length} properties for "${location}"`
    );
  } catch (error) {
    logger.error(`Property search error: ${error}`);
    next(error);
  }
};

/**
 * Get all properties with filtering and pagination
 * GET /api/properties
 */
export const getAllProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse query parameters
    const {
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
      status,
      minPrice,
      maxPrice,
      location,
      search,
      propertyType,
      listingType,
    } = req.query;

    // Convert parameters to appropriate types
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    // Add filters if provided and valid
    if (
      status &&
      Object.values(PropertyStatus).includes(status as PropertyStatus)
    ) {
      filter.status = status;
    }

    if (
      propertyType &&
      Object.values(PropertyType).includes(propertyType as PropertyType)
    ) {
      filter.propertyType = propertyType;
    }

    if (
      listingType &&
      Object.values(ListingType).includes(listingType as ListingType)
    ) {
      filter.listingType = listingType;
    }

    if (location) {
      filter.location = { contains: location, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.lte = parseFloat(maxPrice as string);
    }

    // Handle search query
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await getPrismaClient().property.count({
      where: filter,
    });

    // Get properties with pagination, sorting, and filtering
    const properties = await getPrismaClient().property.findMany({
      skip,
      take: limitNum,
      where: filter,
      orderBy: {
        [sort as string]: order,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        images: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 2,
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Send success response
    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    logger.error(`Get all properties error: ${error}`);
    next(error);
  }
};

/**
 * Get property by ID
 * GET /api/properties/:id
 */
export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get property with related data
    const property = await getPrismaClient().property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        images: true,
        features: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Format price history for frontend display
    const formattedPriceHistory = property.priceHistory.map(
      formatPriceHistoryRecord
    );

    // Check if the property is in the user's favorites - disabled if model doesn't exist
    let isFavorite = false;

    // Sort price history oldest to newest for frontend display
    const sortedPriceHistory = [...formattedPriceHistory].reverse();

    // Send success response
    res.status(200).json({
      success: true,
      data: {
        ...property,
        priceHistory: sortedPriceHistory,
        isFavorite,
      },
    });
  } catch (error) {
    logger.error(`Get property by ID error: ${error}`);
    next(error);
  }
};

/**
 * Get similar properties
 * GET /api/properties/:id/similar
 */
export const getSimilarProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt((req.query.limit as string) || "3", 10);

    // Get property to match
    const property = await getPrismaClient().property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Find similar properties based on location and property type
    const similarProperties = await getPrismaClient().property.findMany({
      where: {
        id: { not: id }, // Exclude the current property
        OR: [
          { location: { contains: property.location.split(",")[0] } },
          { propertyType: property.propertyType },
          { listingType: property.listingType },
        ],
      },
      take: limit,
      include: {
        images: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 2,
        },
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Send success response
    res.status(200).json({
      success: true,
      data: similarProperties,
    });
  } catch (error) {
    logger.error(`Get similar properties error: ${error}`);
    next(error);
  }
};

/**
 * Get featured properties
 * GET /api/properties/featured
 */
export const getFeaturedProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get a limited number of featured properties
    const properties = await getPrismaClient().property.findMany({
      where: { featured: true },
      take: 6,
      include: {
        images: true,
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 2,
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Send success response
    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    logger.error(`Get featured properties error: ${error}`);
    next(error);
  }
};

/**
 * Get properties by agent
 * GET /api/properties/agent/:agentId
 */
export const getPropertiesByAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { agentId } = req.params;

    // Parse query parameters
    const {
      page = "1",
      limit = "10",
      status,
      propertyType,
      listingType,
    } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = { agentId };

    // Add filters if provided and valid
    if (
      status &&
      Object.values(PropertyStatus).includes(status as PropertyStatus)
    ) {
      filter.status = status;
    }

    if (
      propertyType &&
      Object.values(PropertyType).includes(propertyType as PropertyType)
    ) {
      filter.propertyType = propertyType;
    }

    if (
      listingType &&
      Object.values(ListingType).includes(listingType as ListingType)
    ) {
      filter.listingType = listingType;
    }

    // Get total count
    const total = await getPrismaClient().property.count({
      where: filter,
    });

    // Get properties
    const properties = await getPrismaClient().property.findMany({
      skip,
      take: limitNum,
      where: filter,
      include: {
        images: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          take: 2,
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Send success response
    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    logger.error(`Get properties by agent error: ${error}`);
    next(error);
  }
};

// ----------------------
// Property CRUD Controllers
// ----------------------

/**
 * Create a new property
 * POST /api/properties
 */
export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const userId = req.userId;

    if (!userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Get data from request body
    const {
      title,
      description,
      status,
      price,
      size,
      rooms,
      bathrooms,
      location,
      address,
      propertyType,
      listingType,
      latitude,
      longitude,
      features,
    } = req.body;

    // Validate required fields
    if (!title || !status || !price || !location) {
      throw new BadRequestError(
        "Title, status, price, and location are required"
      );
    }

    // Prepare create data for Prisma
    const createData: Prisma.PropertyCreateInput = {
      title,
      description,
      status,
      price: parseFloat(price),
      size: parseFloat(size || "0"),
      rooms: parseInt(rooms || "0", 10),
      bathrooms: parseInt(bathrooms || "0", 10),
      location,
      address,
      agent: {
        connect: { id: userId },
      },
    };

    // Add propertyType if provided and valid
    if (
      propertyType &&
      Object.values(PropertyType).includes(propertyType as PropertyType)
    ) {
      createData.propertyType = propertyType as PropertyType;
    }

    // Add listingType if provided and valid
    if (
      listingType &&
      Object.values(ListingType).includes(listingType as ListingType)
    ) {
      createData.listingType = listingType as ListingType;
    }

    // Handle optional coordinate fields
    if (latitude !== undefined) {
      (createData as any).latitude = parseFloat(latitude);
    }

    if (longitude !== undefined) {
      (createData as any).longitude = parseFloat(longitude);
    }

    // Add features if provided
    if (features && Array.isArray(features)) {
      createData.features = {
        create: features.map((feature: string) => ({
          name: feature,
        })),
      };
    }

    // Create property
    const property = await getPrismaClient().property.create({
      data: createData,
    });

    // Add initial price history entry
    await createPriceHistoryEntry(
      property.id,
      parseFloat(price),
      null,
      userId,
      "INITIAL_LISTING",
      "Property initially listed"
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    logger.error(`Create property error: ${error}`);
    next(error);
  }
};

/**
 * Update a property
 * PUT /api/properties/:id
 */
export const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Get existing property
    const existingProperty = await getPrismaClient().property.findUnique({
      where: { id },
      include: {
        features: true,
      },
    });

    if (!existingProperty) {
      throw new NotFoundError("Property not found");
    }

    // Check if user is the agent of the property
    if (existingProperty.agentId !== userId && req.userRole !== "ADMIN") {
      throw new ApiError("Not authorized to update this property", 403);
    }

    // Get data from request body
    const {
      title,
      description,
      status,
      price,
      size,
      rooms,
      bathrooms,
      location,
      address,
      propertyType,
      listingType,
      latitude,
      longitude,
      features,
      priceChangeReason,
      priceChangeNotes,
    } = req.body;

    // Prepare update data for Prisma
    const updateData: Prisma.PropertyUpdateInput = {
      title,
      description,
      status,
      location,
      address,
    };

    // Add propertyType if provided and valid
    if (
      propertyType &&
      Object.values(PropertyType).includes(propertyType as PropertyType)
    ) {
      updateData.propertyType = propertyType as PropertyType;
    }

    // Add listingType if provided and valid
    if (
      listingType &&
      Object.values(ListingType).includes(listingType as ListingType)
    ) {
      updateData.listingType = listingType as ListingType;
    }

    // Check if price is being updated
    const isPriceChanged =
      price !== undefined &&
      parseFloat(price) !== Number(existingProperty.price);

    // Only add optional numeric fields if they are provided
    if (price !== undefined) {
      updateData.price = parseFloat(price);
    }

    if (size !== undefined) {
      updateData.size = parseFloat(size);
    }

    if (rooms !== undefined) {
      updateData.rooms = parseInt(rooms, 10);
    }

    if (bathrooms !== undefined) {
      updateData.bathrooms = parseInt(bathrooms, 10);
    }

    // Handle latitude/longitude as custom fields if they exist in the schema
    if (latitude !== undefined) {
      (updateData as any).latitude = parseFloat(latitude);
    }

    if (longitude !== undefined) {
      (updateData as any).longitude = parseFloat(longitude);
    }

    // Update property
    const property = await getPrismaClient().property.update({
      where: { id },
      data: updateData,
    });

    // If price changed, add to price history
    if (isPriceChanged) {
      // Determine reason for price change
      let reason: PriceChangeReason = priceChangeReason || "OTHER";
      let notes = priceChangeNotes || "";

      if (!priceChangeReason) {
        const currentPrice = Number(existingProperty.price);
        const newPrice = parseFloat(price);

        if (newPrice < currentPrice) {
          reason = "PRICE_REDUCTION";
          notes = notes || `Price reduced from ${currentPrice} to ${newPrice}`;
        } else if (newPrice > currentPrice) {
          reason = "PRICE_INCREASE";
          notes =
            notes || `Price increased from ${currentPrice} to ${newPrice}`;
        }
      }

      await createPriceHistoryEntry(
        id,
        parseFloat(price),
        Number(existingProperty.price),
        userId,
        reason,
        notes
      );
    }

    // Update features if provided
    if (features) {
      // Delete existing features
      await getPrismaClient().propertyFeature.deleteMany({
        where: { propertyId: id },
      });

      // Add new features
      await Promise.all(
        features.map((feature: string) =>
          getPrismaClient().propertyFeature.create({
            data: {
              name: feature,
              property: {
                connect: { id },
              },
            },
          })
        )
      );
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    logger.error(`Update property error: ${error}`);
    next(error);
  }
};

/**
 * Delete a property
 * DELETE /api/properties/:id
 */
export const deleteProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Get existing property
    const existingProperty = await getPrismaClient().property.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existingProperty) {
      throw new NotFoundError("Property not found");
    }

    // Check if user is the agent of the property or an admin
    if (existingProperty.agentId !== userId && req.userRole !== "ADMIN") {
      throw new ApiError("Not authorized to delete this property", 403);
    }

    // Delete property (cascade will handle related records)
    await getPrismaClient().property.delete({
      where: { id },
    });

    // Delete property images from the filesystem if they have a url field
    if (existingProperty.images.length > 0) {
      existingProperty.images.forEach((image) => {
        // Check if image has a url property or filename property
        const filename = (image as any).url?.split("/").pop();

        if (filename) {
          const imagePath = path.join(uploadConfig.propertiesDir, filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete property error: ${error}`);
    next(error);
  }
};

// ----------------------
// Property Price History Controllers
// ----------------------

/**
 * Get property price history
 * GET /api/properties/:id/price-history
 */
export const getPropertyPriceHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get property with price history
    const property = await getPrismaClient().property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        price: true,
        priceHistory: {
          orderBy: {
            date: "desc",
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Format price history for frontend display
    const formattedPriceHistory = property.priceHistory.map(
      formatPriceHistoryRecord
    );

    res.status(200).json({
      success: true,
      data: {
        propertyId: property.id,
        title: property.title,
        currentPrice: Number(property.price),
        priceHistory: formattedPriceHistory,
      },
    });
  } catch (error) {
    logger.error(`Get property price history error: ${error}`);
    next(error);
  }
};

/**
 * Add price history entry
 * POST /api/properties/:id/price-history
 */
export const addPriceHistoryEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { price, reason, notes } = req.body;

    if (!price || price <= 0) {
      throw new BadRequestError("Valid price is required");
    }

    // Get existing property and verify access
    const existingProperty = await verifyPropertyAccess(
      id,
      userId,
      req.userRole as UserRole,
      "Not authorized to update price history"
    );

    // Create price history entry
    const priceHistory = await getPrismaClient().priceHistory.create({
      data: {
        propertyId: id,
        price: parseFloat(price),
        previousPrice: Number(existingProperty.price),
        reason: reason || "OTHER",
        notes,
        createdById: userId,
        date: new Date(),
      },
    });

    // Update property price
    await getPrismaClient().property.update({
      where: { id },
      data: { price: parseFloat(price) },
    });

    res.status(201).json({
      success: true,
      message: "Price history entry added successfully",
      data: priceHistory,
    });
  } catch (error) {
    logger.error(`Add price history entry error: ${error}`);
    next(error);
  }
};

// ----------------------
// Property Image Controllers
// ----------------------

/**
 * Upload property images
 * POST /api/properties/:id/images
 */
export const uploadPropertyImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const files = req.files as Express.Multer.File[];

    if (!userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Verify access to the property
    await verifyPropertyAccess(
      id,
      userId,
      req.userRole as UserRole,
      "Not authorized to upload images for this property"
    );

    // Check if files were uploaded
    if (!files || files.length === 0) {
      throw new BadRequestError("No images uploaded");
    }

    // Get current highest order index
    const highestOrderImage = await getPrismaClient().propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { orderIndex: "desc" },
    });

    const startOrderIndex = highestOrderImage
      ? highestOrderImage.orderIndex + 1
      : 0;

    // Create image records - adjust based on the schema
    const imagePromises = files.map((file, index) => {
      return getPrismaClient().propertyImage.create({
        data: {
          url: `/uploads/properties/${file.filename}`,
          orderIndex: startOrderIndex + index,
          property: {
            connect: { id },
          },
        },
      });
    });

    const images = await Promise.all(imagePromises);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: images,
    });
  } catch (error) {
    logger.error(`Upload property images error: ${error}`);
    next(error);
  }
};
