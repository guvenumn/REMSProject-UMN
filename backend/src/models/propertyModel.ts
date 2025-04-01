// src/middleware/uploadMiddleware.ts
import multer from "multer";
import { MulterFile } from "../types/multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import config from "../config";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

// Ensure upload directories exist
const ensureDirectoriesExist = () => {
  const directories = [
    config.upload.tempDir,
    config.upload.avatarsDir,
    config.upload.propertiesDir,
    config.upload.documentsDir,
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (error) {
        logger.error(`Failed to create directory ${dir}: ${error}`);
      }
    }
  });
};

// Create upload directories
ensureDirectoriesExist();

// Configure storage for different upload types
const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(
        file.originalname
      )}`;
      cb(null, uniqueName);
    },
  });
};

// File type validators
const imageFileFilter = (
  req: Request,
  file: MulterFile,
  callback: multer.FileFilterCallback
) => {
  if (!config.upload.allowedImageTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestError(
        `Invalid file type. Only ${config.upload.allowedImageTypes.join(
          ", "
        )} are allowed.`
      )
    );
  }
  callback(null, true);
};
const documentFileFilter = (
  req: Request,
  file: MulterFile,
  callback: multer.FileFilterCallback
) => {
  if (!config.upload.allowedDocumentTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestError(
        `Invalid file type. Only ${config.upload.allowedDocumentTypes.join(
          ", "
        )} are allowed.`
      )
    );
  }
  callback(null, true);
};

// Create multer instances for different types of uploads
export const avatarUpload = multer({
  storage: createStorage(config.upload.avatarsDir),
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB
    files: 1, // Only one avatar at a time
  },
  fileFilter: imageFileFilter,
});

export const propertyImageUpload = multer({
  storage: createStorage(config.upload.propertiesDir),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles, // Multiple images allowed
  },
  fileFilter: imageFileFilter,
});

export const documentUpload = multer({
  storage: createStorage(config.upload.documentsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 5,
  },
  fileFilter: documentFileFilter,
});

/**
 * Generic upload to temporary directory
 * Useful when you need to process the file before moving it to final location
 */
export const tempUpload = multer({
  storage: createStorage(config.upload.tempDir),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
  },
});

/**
 * Helper to move a file from temp directory to final destination
 */
export const moveFile = (
  tempFilePath: string,
  destinationDir: string,
  newFilename?: string
): string => {
  // Ensure destination directory exists
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Get original filename if new one not provided
  const filename = newFilename || path.basename(tempFilePath);
  const destinationPath = path.join(destinationDir, filename);

  // Move the file
  fs.renameSync(tempFilePath, destinationPath);

  return destinationPath;
};

/**
 * Delete a file
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}: ${error}`);
    return false;
  }
};
