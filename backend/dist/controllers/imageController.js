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
exports.deleteImageController = exports.uploadMultipleImages = exports.uploadSingleImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const uploadService_1 = require("../services/uploadService");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(__dirname, "../../uploads/temp");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError(`Invalid file type. Only ${allowedMimeTypes.join(", ")} are allowed.`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10,
    },
    fileFilter,
});
const uploadSingleImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            throw new errors_1.BadRequestError("No image file provided");
        }
        const result = yield (0, uploadService_1.uploadImage)(req.file);
        fs_1.default.unlink(req.file.path, (err) => {
            var _a;
            if (err) {
                logger_1.logger.error(`Failed to delete temporary file: ${(_a = req.file) === null || _a === void 0 ? void 0 : _a.path}`);
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
    }
    catch (error) {
        if (req.file) {
            fs_1.default.unlink(req.file.path, () => { });
        }
        next(error);
    }
});
exports.uploadSingleImage = uploadSingleImage;
const uploadMultipleImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            throw new errors_1.BadRequestError("No image files provided");
        }
        const uploads = yield Promise.all(req.files.map((file) => (0, uploadService_1.uploadImage)(file)));
        req.files.forEach((file) => {
            fs_1.default.unlink(file.path, (err) => {
                if (err) {
                    logger_1.logger.error(`Failed to delete temporary file: ${file.path}`);
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
    }
    catch (error) {
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((file) => {
                fs_1.default.unlink(file.path, () => { });
            });
        }
        next(error);
    }
});
exports.uploadMultipleImages = uploadMultipleImages;
const deleteImageController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            throw new errors_1.BadRequestError("Public ID is required");
        }
        yield (0, uploadService_1.deleteImage)(publicId);
        res.status(200).json({
            success: true,
            message: "Image deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteImageController = deleteImageController;
