"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.uploadDocument = exports.deleteImage = exports.uploadMultipleImages = exports.uploadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("cloudinary");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
    secure: true,
});
const uploadImage = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = "property-platform") {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            throw new errors_1.InternalServerError("Cloud storage not properly configured");
        }
        logger_1.logger.info(`Uploading file: ${file.originalname}`);
        const result = yield new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: "image",
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                transformation: [
                    { width: 2000, crop: "limit" },
                    { quality: "auto:good" },
                ],
            }, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
            fs_1.default.createReadStream(file.path).pipe(uploadStream);
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes,
        };
    }
    catch (error) {
        logger_1.logger.error("Image upload failed:", error);
        throw new errors_1.InternalServerError("Failed to upload image to cloud storage");
    }
    finally {
        try {
            if (file.path && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
                logger_1.logger.info(`Temporary file removed: ${file.path}`);
            }
        }
        catch (cleanupError) {
            logger_1.logger.warn(`Failed to remove temporary file: ${file.path}`, cleanupError);
        }
    }
});
exports.uploadImage = uploadImage;
const uploadMultipleImages = (files_1, ...args_1) => __awaiter(void 0, [files_1, ...args_1], void 0, function* (files, folder = "property-platform") {
    const uploadPromises = files.map((file) => (0, exports.uploadImage)(file, folder));
    return Promise.all(uploadPromises);
});
exports.uploadMultipleImages = uploadMultipleImages;
const deleteImage = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            throw new errors_1.InternalServerError("Cloud storage not properly configured");
        }
        logger_1.logger.info(`Deleting image with public ID: ${publicId}`);
        const result = yield cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result === "ok") {
            logger_1.logger.info(`Successfully deleted image: ${publicId}`);
            return true;
        }
        else {
            logger_1.logger.warn(`Failed to delete image: ${publicId}, result: ${result.result}`);
            return false;
        }
    }
    catch (error) {
        logger_1.logger.error(`Error deleting image ${publicId}:`, error);
        throw new errors_1.InternalServerError("Failed to delete image from cloud storage");
    }
});
exports.deleteImage = deleteImage;
const uploadDocument = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = "property-documents") {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            throw new errors_1.InternalServerError("Cloud storage not properly configured");
        }
        logger_1.logger.info(`Uploading document: ${file.originalname}`);
        const result = yield new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: "raw",
                use_filename: true,
                unique_filename: true,
                overwrite: false,
            }, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
            fs_1.default.createReadStream(file.path).pipe(uploadStream);
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: 0,
            height: 0,
            format: file.mimetype,
            size: result.bytes,
        };
    }
    catch (error) {
        logger_1.logger.error("Document upload failed:", error);
        throw new errors_1.InternalServerError("Failed to upload document to cloud storage");
    }
    finally {
        try {
            if (file.path && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
                logger_1.logger.info(`Temporary file removed: ${file.path}`);
            }
        }
        catch (cleanupError) {
            logger_1.logger.warn(`Failed to remove temporary file: ${file.path}`, cleanupError);
        }
    }
});
exports.uploadDocument = uploadDocument;
const deleteDocument = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            throw new errors_1.InternalServerError("Cloud storage not properly configured");
        }
        logger_1.logger.info(`Deleting document with public ID: ${publicId}`);
        const result = yield cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: "raw",
        });
        if (result.result === "ok") {
            logger_1.logger.info(`Successfully deleted document: ${publicId}`);
            return true;
        }
        else {
            logger_1.logger.warn(`Failed to delete document: ${publicId}, result: ${result.result}`);
            return false;
        }
    }
    catch (error) {
        logger_1.logger.error(`Error deleting document ${publicId}:`, error);
        throw new errors_1.InternalServerError("Failed to delete document from cloud storage");
    }
});
exports.deleteDocument = deleteDocument;
