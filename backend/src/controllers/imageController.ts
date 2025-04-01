// file: backend/src/controllers/imageController.ts

import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import { uploadImage, deleteImage } from "../services/uploadService";

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/temp");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter to only accept image files
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept image files only
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Only ${allowedMimeTypes.join(", ")} are allowed.`
      )
    );
  }
};

// Configure upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files per upload
  },
  fileFilter,
});

/**
 * Upload a single image
 */
export const uploadSingleImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No image file provided");
    }

    // Upload to cloud storage using the service
    const result = await uploadImage(req.file);

    // Delete temp file after upload
    fs.unlink(req.file.path, (err) => {
      if (err) {
        logger.error(`Failed to delete temporary file: ${req.file?.path}`);
      }
    });

    res.status(201).json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    // Make sure to clean up temp file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError("No image files provided");
    }

    // Upload all files
    const uploads = await Promise.all(
      (req.files as Express.Multer.File[]).map((file) => uploadImage(file))
    );

    // Delete all temp files
    req.files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          logger.error(`Failed to delete temporary file: ${file.path}`);
        }
      });
    });

    res.status(201).json({
      success: true,
      data: uploads.map((upload) => ({
        url: upload.url,
        publicId: upload.publicId,
        width: upload.width,
        height: upload.height,
      })),
    });
  } catch (error) {
    // Clean up temp files
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        fs.unlink(file.path, () => {});
      });
    }
    next(error);
  }
};

/**
 * Delete an image by public ID
 */
export const deleteImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw new BadRequestError("Public ID is required");
    }

    // Delete from cloud storage
    await deleteImage(publicId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
