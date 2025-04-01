// Path: /backend/src/services/propertyService.ts
import { PrismaClient, Prisma, PropertyStatus } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../utils/errors";
import path from "path";
import fs from "fs";
import config from "../config";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Create uploadConfig object with fallbacks for potentially missing properties
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

/**
 * Get all properties with filtering, pagination, and sorting
 */
export const getAllProperties = async (params: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  search?: string;
}) => {
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    status,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    location,
    search,
  } = params;

  const skip = (page - 1) * limit;

  // Build filter object
  const filter: any = {};

  if (status) filter.status = status;
  if (location) filter.location = { contains: location, mode: "insensitive" };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.gte = minPrice;
    if (maxPrice) filter.price.lte = maxPrice;
  }

  if (bedrooms) {
    filter.rooms = bedrooms; // Use rooms field instead of bedrooms
  }

  if (bathrooms) {
    filter.bathrooms = bathrooms;
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
  const total = await prisma.property.count({
    where: filter,
  });

  // Get properties with pagination, sorting, and filtering
  const properties = await prisma.property.findMany({
    skip,
    take: limit,
    where: filter,
    orderBy: {
      [sort]: order,
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
      _count: {
        select: {
          images: true, // Select at least one field
        },
      },
    },
  });

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    properties,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

/**
 * Get property by ID
 */
export const getPropertyById = async (id: string, userId?: string) => {
  // Get property with related data
  const property = await prisma.property.findUnique({
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
      _count: {
        select: {
          images: true, // Select at least one field
        },
      },
    },
  });

  if (!property) {
    throw new NotFoundError("Property not found");
  }

  return property;
};

/**
 * Create a new property
 */
export const createProperty = async (
  data: {
    title: string;
    description?: string;
    status: string;
    price: number;
    size?: number;
    bedrooms?: number;
    bathrooms?: number;
    location: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    features?: string[];
    amenities?: string[];
    yearBuilt?: number;
  },
  agentId: string
) => {
  // Validate required fields
  if (!data.title || !data.status || !data.price || !data.location) {
    throw new BadRequestError(
      "Title, status, price, and location are required"
    );
  }

  // Create base property data object with required fields
  const createData: any = {
    title: data.title,
    description: data.description || "",
    status: data.status as PropertyStatus,
    price: data.price,
    size: data.size || 0, // Default to 0 if undefined
    rooms: data.bedrooms || 0,
    bathrooms: data.bathrooms || 0,
    location: data.location,
    address: data.address || "",
    agent: {
      connect: { id: agentId },
    },
  };

  // Add optional fields only if they have values
  if (data.latitude !== undefined) {
    createData.latitude = data.latitude;
  }

  if (data.longitude !== undefined) {
    createData.longitude = data.longitude;
  }

  // Handle features separately
  if (data.features && data.features.length > 0) {
    createData.features = {
      create: data.features.map((feature) => ({
        name: feature,
      })),
    };
  }

  // Create property
  const property = await prisma.property.create({
    data: createData,
  });

  return property;
};

/**
 * Update a property
 */
export const updateProperty = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    price?: number;
    size?: number;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    features?: string[];
  },
  userId: string
) => {
  // Get existing property
  const existingProperty = await prisma.property.findUnique({
    where: { id },
    include: {
      features: true,
    },
  });

  if (!existingProperty) {
    throw new NotFoundError("Property not found");
  }

  // Check if user is the agent of the property
  if (existingProperty.agentId !== userId) {
    throw new BadRequestError("Not authorized to update this property");
  }

  // Create update data object
  const updateData: any = {};

  // Only include fields that have values to update
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined)
    updateData.status = data.status as PropertyStatus;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.size !== undefined) updateData.size = data.size;
  if (data.bedrooms !== undefined) updateData.rooms = data.bedrooms;
  if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;

  // Update property
  const property = await prisma.property.update({
    where: { id },
    data: updateData,
  });

  // Update features if provided
  if (data.features) {
    // Delete existing features
    await prisma.propertyFeature.deleteMany({
      where: { propertyId: id },
    });

    // Add new features
    for (const feature of data.features) {
      await prisma.propertyFeature.create({
        data: {
          name: feature,
          property: {
            connect: { id },
          },
        },
      });
    }
  }

  return property;
};

/**
 * Delete a property
 */
export const deleteProperty = async (
  id: string,
  userId: string,
  userRole?: string
) => {
  // Get existing property
  const existingProperty = await prisma.property.findUnique({
    where: { id },
    include: {
      images: true,
    },
  });

  if (!existingProperty) {
    throw new NotFoundError("Property not found");
  }

  // Check if user is the agent of the property or an admin
  if (existingProperty.agentId !== userId && userRole !== "ADMIN") {
    throw new BadRequestError("Not authorized to delete this property");
  }

  // Delete property (cascade will handle related records)
  await prisma.property.delete({
    where: { id },
  });

  // Delete property images from the filesystem
  if (existingProperty.images.length > 0) {
    for (const image of existingProperty.images) {
      // Handle different image property structures
      const filename =
        (image as any).filename || (image as any).url?.split("/").pop();

      if (filename) {
        const imagePath = path.join(uploadConfig.propertiesDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }
  }

  return true;
};

/**
 * Upload property images
 */
export const uploadPropertyImages = async (
  propertyId: string,
  userId: string,
  userRole: string,
  files: Express.Multer.File[]
) => {
  // Check if property exists and user is the agent
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new NotFoundError("Property not found");
  }

  if (property.agentId !== userId && userRole !== "ADMIN") {
    throw new BadRequestError(
      "Not authorized to upload images for this property"
    );
  }

  // Check if files were uploaded
  if (!files || files.length === 0) {
    throw new BadRequestError("No images uploaded");
  }

  // Create image records
  const images = [];
  let orderIndex = 0;

  // Get current max orderIndex
  const existingImages = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { orderIndex: "desc" },
    take: 1,
  });

  if (existingImages.length > 0) {
    orderIndex = existingImages[0].orderIndex + 1;
  }

  for (const file of files) {
    // Fix: Create image with proper structure
    const imageData: Prisma.PropertyImageCreateInput = {
      url: `/uploads/properties/${file.filename}`,
      orderIndex: orderIndex++,
      property: {
        connect: { id: propertyId },
      },
    };

    const image = await prisma.propertyImage.create({
      data: imageData,
    });

    images.push(image);
  }

  return images;
};

/**
 * Delete a property image
 */
export const deletePropertyImage = async (
  propertyId: string,
  imageId: string,
  userId: string,
  userRole?: string
) => {
  // Check if property exists and user is the agent
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new NotFoundError("Property not found");
  }

  if (property.agentId !== userId && userRole !== "ADMIN") {
    throw new BadRequestError(
      "Not authorized to delete images for this property"
    );
  }

  // Get image
  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
  });

  if (!image || image.propertyId !== propertyId) {
    throw new NotFoundError("Image not found");
  }

  // Delete image from database
  await prisma.propertyImage.delete({
    where: { id: imageId },
  });

  // Delete image file
  const filename = (image as any).url?.split("/").pop();
  if (filename) {
    const imagePath = path.join(uploadConfig.propertiesDir, filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  return true;
};

/**
 * Get featured properties
 */
export const getFeaturedProperties = async (limit = 6) => {
  // Get a limited number of featured properties
  const properties = await prisma.property.findMany({
    where: { featured: true },
    take: limit,
    include: {
      images: true,
      agent: {
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
  });

  return properties;
};

/**
 * Get properties by agent
 */
export const getPropertiesByAgent = async (
  agentId: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
  }
) => {
  const { page = 1, limit = 10, status } = params;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { agentId };
  if (status) filter.status = status;

  // Get total count
  const total = await prisma.property.count({
    where: filter,
  });

  // Get properties
  const properties = await prisma.property.findMany({
    skip,
    take: limit,
    where: filter,
    include: {
      images: true,
      _count: {
        select: {
          images: true, // Select at least one field
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    properties,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

/**
 * Get similar properties
 */
export const getSimilarProperties = async (id: string, limit = 3) => {
  // Get property to match
  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    throw new NotFoundError("Property not found");
  }

  // Find similar properties based on location and price range
  const similarProperties = await prisma.property.findMany({
    where: {
      id: { not: id }, // Exclude the current property
      OR: [
        { location: { contains: property.location.split(",")[0] } },
        {
          price: {
            // Fix: Convert Decimal to number for arithmetic operations
            gte: Number(property.price) * 0.8,
            lte: Number(property.price) * 1.2,
          },
        },
      ],
    },
    take: limit,
    include: {
      images: true,
      agent: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return similarProperties;
};
