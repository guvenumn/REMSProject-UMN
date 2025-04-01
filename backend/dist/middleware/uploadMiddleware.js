"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.moveFile = exports.tempUpload = exports.uploadDocument = exports.uploadPropertyImages = exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const ensureDirectoriesExist = () => {
    const directories = [
        config_1.default.upload.tempDir,
        config_1.default.upload.avatarsDir,
        config_1.default.upload.propertiesDir,
        config_1.default.upload.documentsDir,
        config_1.default.upload.imagesDir,
    ];
    directories.forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
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
            const timestamp = Date.now();
            const uniqueId = (0, uuid_1.v4)();
            const ext = path_1.default.extname(file.originalname);
            const fileName = `${timestamp}-${uniqueId}${ext}`;
            cb(null, fileName);
        },
    });
};
const avatarStorage = createStorage(config_1.default.upload.avatarsDir);
const propertyStorage = createStorage(config_1.default.upload.propertiesDir);
const documentStorage = createStorage(config_1.default.upload.documentsDir);
const tempStorage = createStorage(config_1.default.upload.tempDir);
const imageFilter = (req, file, cb) => {
    if (config_1.default.upload.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Only ${config_1.default.upload.allowedImageTypes.join(", ")} are allowed!`));
    }
};
const documentFilter = (req, file, cb) => {
    if (config_1.default.upload.allowedDocumentTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Only ${config_1.default.upload.allowedDocumentTypes.join(", ")} are allowed!`));
    }
};
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: 1,
    },
});
exports.uploadPropertyImages = (0, multer_1.default)({
    storage: propertyStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: config_1.default.upload.maxFiles,
    },
});
exports.uploadDocument = (0, multer_1.default)({
    storage: documentStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 5,
    },
});
exports.tempUpload = (0, multer_1.default)({
    storage: tempStorage,
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
        console.error(`Failed to delete file ${filePath}:`, error);
        return false;
    }
};
exports.deleteFile = deleteFile;
