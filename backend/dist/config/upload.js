"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config = {
    imagesDir: path_1.default.join(process.cwd(), "uploads/images"),
    avatarsDir: path_1.default.join(process.cwd(), "uploads/avatars"),
    propertiesDir: path_1.default.join(process.cwd(), "uploads/properties"),
    maxFileSize: 5 * 1024 * 1024,
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxFiles: 10,
};
exports.default = config;
