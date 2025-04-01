"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    app: {
        port: parseInt(process.env.PORT || "3002", 10),
        environment: process.env.NODE_ENV || "development",
        rootDir: process.cwd(),
        host: process.env.HOST || "0.0.0.0",
        baseUrl: process.env.API_BASE_URL || "http://localhost:3002",
    },
    db: {
        url: process.env.DATABASE_URL ||
            "postgres://remsdbu:rems@db25@localhost:5432/remsdb",
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
        ssl: process.env.DB_SSL === "true",
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || "your-secret-key-min-32-chars-long",
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
        resetTokenExpiresIn: parseInt(process.env.RESET_TOKEN_EXPIRES_IN || "3600000", 10),
        bcrypt: {
            saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
        },
    },
    cors: {
        origin: process.env.NODE_ENV === "production"
            ? ["https://www.remsiq.com", "http://24.144.115.137:3000"]
            : process.env.CORS_ORIGIN || [
                "http://localhost:3000",
                "http://24.144.115.137:3000",
            ],
        credentials: process.env.CORS_CREDENTIALS === "true" || true,
    },
    upload: {
        baseDir: path_1.default.join(process.cwd(), "uploads"),
        imagesDir: path_1.default.join(process.cwd(), "uploads", "images"),
        avatarsDir: path_1.default.join("/var/www/rems/frontend/public/uploads", "avatars"),
        propertiesDir: path_1.default.join(process.cwd(), "uploads", "properties"),
        documentsDir: path_1.default.join(process.cwd(), "uploads", "documents"),
        tempDir: path_1.default.join(process.cwd(), "uploads", "temp"),
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
        maxFiles: parseInt(process.env.MAX_FILES || "10", 10),
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES ||
            "image/jpeg,image/png,image/webp,application/pdf").split(","),
        allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        allowedDocumentTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
        ],
    },
    logging: {
        level: process.env.LOG_LEVEL || "info",
        file: process.env.LOG_FILE || path_1.default.join(process.cwd(), "logs", "app.log"),
        maxSize: parseInt(process.env.LOG_MAX_SIZE || "10485760", 10),
        maxFiles: parseInt(process.env.LOG_MAX_FILES || "5", 10),
        console: process.env.LOG_TO_CONSOLE !== "false",
    },
    socket: {
        enabled: process.env.SOCKET_ENABLED !== "false",
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? ["https://www.remsiq.com", "http://24.144.115.137:3000"]
                : process.env.SOCKET_CORS_ORIGIN ||
                    process.env.CORS_ORIGIN || [
                    "http://localhost:3000",
                    "http://24.144.115.137:3000",
                ],
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || "60000", 10),
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || "25000", 10),
    },
    frontend: {
        url: process.env.NODE_ENV === "production"
            ? "https://www.remsiq.com"
            : process.env.FRONTEND_URL || "http://localhost:3000",
    },
};
exports.default = config;
