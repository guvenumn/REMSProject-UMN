// src/services/uploadService.ts
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger";
import { InternalServerError } from "../utils/errors";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// Define image upload result interface
interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Upload an image to Cloudinary
 * @param file The file to upload (from multer)
 * @param folder Cloudinary folder to upload to
 * @returns Upload result information
 */
export const uploadImage = async (
  file: Express.Multer.File,
  folder: string = "property-platform"
): Promise<UploadResult> => {
  try {
    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerError("Cloud storage not properly configured");
    }

    logger.info(`Uploading file: ${file.originalname}`);

    const result = await new Promise<any>((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          transformation: [
            { width: 2000, crop: "limit" }, // Resize to max width
            { quality: "auto:good" }, // Optimize quality
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      // Pipe file to upload stream
      fs.createReadStream(file.path).pipe(uploadStream);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.error("Image upload failed:", error);
    throw new InternalServerError("Failed to upload image to cloud storage");
  } finally {
    // Clean up the temporary file
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.info(`Temporary file removed: ${file.path}`);
      }
    } catch (cleanupError) {
      logger.warn(
        `Failed to remove temporary file: ${file.path}`,
        cleanupError
      );
    }
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param files Array of files to upload (from multer)
 * @param folder Cloudinary folder to upload to
 * @returns Array of upload result information
 */
export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = "property-platform"
): Promise<UploadResult[]> => {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary
 * @param publicId The public ID of the image to delete
 * @returns Success status
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerError("Cloud storage not properly configured");
    }

    logger.info(`Deleting image with public ID: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      logger.info(`Successfully deleted image: ${publicId}`);
      return true;
    } else {
      logger.warn(
        `Failed to delete image: ${publicId}, result: ${result.result}`
      );
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting image ${publicId}:`, error);
    throw new InternalServerError("Failed to delete image from cloud storage");
  }
};

/**
 * Upload a document to Cloudinary
 * @param file The file to upload (from multer)
 * @param folder Cloudinary folder to upload to
 * @returns Upload result information
 */
export const uploadDocument = async (
  file: Express.Multer.File,
  folder: string = "property-documents"
): Promise<UploadResult> => {
  try {
    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerError("Cloud storage not properly configured");
    }

    logger.info(`Uploading document: ${file.originalname}`);

    const result = await new Promise<any>((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      // Pipe file to upload stream
      fs.createReadStream(file.path).pipe(uploadStream);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: 0,
      height: 0,
      format: file.mimetype,
      size: result.bytes,
    };
  } catch (error) {
    logger.error("Document upload failed:", error);
    throw new InternalServerError("Failed to upload document to cloud storage");
  } finally {
    // Clean up the temporary file
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.info(`Temporary file removed: ${file.path}`);
      }
    } catch (cleanupError) {
      logger.warn(
        `Failed to remove temporary file: ${file.path}`,
        cleanupError
      );
    }
  }
};

/**
 * Delete a document from Cloudinary
 * @param publicId The public ID of the document to delete
 * @returns Success status
 */
export const deleteDocument = async (publicId: string): Promise<boolean> => {
  try {
    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerError("Cloud storage not properly configured");
    }

    logger.info(`Deleting document with public ID: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    if (result.result === "ok") {
      logger.info(`Successfully deleted document: ${publicId}`);
      return true;
    } else {
      logger.warn(
        `Failed to delete document: ${publicId}, result: ${result.result}`
      );
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting document ${publicId}:`, error);
    throw new InternalServerError(
      "Failed to delete document from cloud storage"
    );
  }
};
