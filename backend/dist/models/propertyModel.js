"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.moveFile = exports.tempUpload = exports.documentUpload = exports.propertyImageUpload = exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const ensureDirectoriesExist = () => {
    const directories = [
        config_1.default.upload.tempDir,
        config_1.default.upload.avatarsDir,
        config_1.default.upload.propertiesDir,
        config_1.default.upload.documentsDir,
    ];
    directories.forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            try {
                fs_1.default.mkdirSync(dir, { recursive: true });
                logger_1.logger.info(`Created directory: ${dir}`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to create directory ${dir}: ${error}`);
            }
        }
    });
};
ensureDirectoriesExist();
const createStorage = (destination) => {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, destination);
        },
        filename: (_req, file, cb) => {
            const uniqueName = `${Date.now()}-${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
            cb(null, uniqueName);
        },
    });
};
const imageFileFilter = (req, file, callback) => {
    if (!config_1.default.upload.allowedImageTypes.includes(file.mimetype)) {
        return callback(new errors_1.BadRequestError(`Invalid file type. Only ${config_1.default.upload.allowedImageTypes.join(", ")} are allowed.`));
    }
    callback(null, true);
};
const documentFileFilter = (req, file, callback) => {
    if (!config_1.default.upload.allowedDocumentTypes.includes(file.mimetype)) {
        return callback(new errors_1.BadRequestError(`Invalid file type. Only ${config_1.default.upload.allowedDocumentTypes.join(", ")} are allowed.`));
    }
    callback(null, true);
};
exports.avatarUpload = (0, multer_1.default)({
    storage: createStorage(config_1.default.upload.avatarsDir),
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: 1,
    },
    fileFilter: imageFileFilter,
});
exports.propertyImageUpload = (0, multer_1.default)({
    storage: createStorage(config_1.default.upload.propertiesDir),
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: config_1.default.upload.maxFiles,
    },
    fileFilter: imageFileFilter,
});
exports.documentUpload = (0, multer_1.default)({
    storage: createStorage(config_1.default.upload.documentsDir),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
    },
    fileFilter: documentFileFilter,
});
exports.tempUpload = (0, multer_1.default)({
    storage: createStorage(config_1.default.upload.tempDir),
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: 1,
    },
});
const moveFile = (tempFilePath, destinationDir, newFilename) => {
    if (!fs_1.default.existsSync(destinationDir)) {
        fs_1.default.mkdirSync(destinationDir, { recursive: true });
    }
    const filename = newFilename || path_1.default.basename(tempFilePath);
    const destinationPath = path_1.default.join(destinationDir, filename);
    fs_1.default.renameSync(tempFilePath, destinationPath);
    return destinationPath;
};
exports.moveFile = moveFile;
const deleteFile = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        logger_1.logger.error(`Failed to delete file ${filePath}: ${error}`);
        return false;
    }
};
exports.deleteFile = deleteFile;
