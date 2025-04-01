// src/middleware/uploadMiddleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import config from "../config";
import { MulterFile } from "../types/multer";

// Ensure all upload directories exist
const ensureDirectoriesExist = () => {
  const directories = [
    config.upload.tempDir,
    config.upload.avatarsDir,
    config.upload.propertiesDir,
    config.upload.documentsDir,
    config.upload.imagesDir,
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Create directories if they don't exist
ensureDirectoriesExist();

// Configure storage for different upload types
const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      const fileName = `${timestamp}-${uniqueId}${ext}`;
      cb(null, fileName);
    },
  });
};

// Storage configurations
const avatarStorage = createStorage(config.upload.avatarsDir);
const propertyStorage = createStorage(config.upload.propertiesDir);
const documentStorage = createStorage(config.upload.documentsDir);
const tempStorage = createStorage(config.upload.tempDir);

// File filters
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Only ${config.upload.allowedImageTypes.join(", ")} are allowed!`
      )
    );
  }
};

const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (config.upload.allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Only ${config.upload.allowedDocumentTypes.join(", ")} are allowed!`
      )
    );
  }
};

// Create multer instances
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB by default
    files: 1, // Only one avatar at a time
  },
});

export const uploadPropertyImages = multer({
  storage: propertyStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
    files: 5,
  },
});

export const tempUpload = multer({
  storage: tempStorage,
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
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
};
