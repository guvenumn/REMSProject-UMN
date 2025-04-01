"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const config_1 = __importDefault(require("./config"));
const errors_1 = require("./utils/errors");
const logger_1 = require("./utils/logger");
const index_1 = __importDefault(require("./routes/index"));
const websocket_1 = require("./websocket");
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const app = (0, express_1.default)();
const portValue = process.env.PORT || (config_1.default.app && config_1.default.app.port) || 3001;
const port = typeof portValue === "string" ? parseInt(portValue, 10) : portValue;
const corsOrigin = ((_a = config_1.default.cors) === null || _a === void 0 ? void 0 : _a.origin) || "*";
const allowedOrigins = Array.isArray(corsOrigin)
    ? corsOrigin
    : (corsOrigin === "*" ? "*" : [corsOrigin]);
if (allowedOrigins === "*") {
    app.use((0, cors_1.default)({
        origin: "*",
        credentials: ((_b = config_1.default.cors) === null || _b === void 0 ? void 0 : _b.credentials) || true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
}
else {
    app.use((0, cors_1.default)({
        origin: function (origin, callback) {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                logger_1.logger.warn(`CORS blocked request from: ${origin}`);
                return callback(null, false);
            }
            return callback(null, true);
        },
        credentials: ((_c = config_1.default.cors) === null || _c === void 0 ? void 0 : _c.credentials) || true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
}
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
try {
    const morgan = require("morgan");
    app.use(morgan("combined"));
}
catch (err) {
    logger_1.logger.warn("Morgan logger not available, continuing without it");
}
const uploadsPath = ((_d = config_1.default.upload) === null || _d === void 0 ? void 0 : _d.baseDir) || path_1.default.join(__dirname, "../uploads");
app.use("/uploads", express_1.default.static(uploadsPath, { maxAge: "1d" }));
app.use("/api", index_1.default);
app.use("/health", healthRoutes_1.default);
app.use("/api/health", healthRoutes_1.default);
app.get("/health-legacy", (req, res) => {
    var _a;
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: ((_a = config_1.default.app) === null || _a === void 0 ? void 0 : _a.environment) || "development",
    });
});
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`Error: ${err.message}`, { stack: err.stack });
    if (err instanceof errors_1.ApiError) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
app.use(errorHandler);
const server = http_1.default.createServer(app);
(0, websocket_1.initializeSocketServer)(app, server);
const host = ((_e = config_1.default.app) === null || _e === void 0 ? void 0 : _e.host) || "0.0.0.0";
server.listen(port, host, () => {
    var _a, _b;
    logger_1.logger.info(`Server running on port ${port} - http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
    logger_1.logger.info(`Environment: ${((_a = config_1.default.app) === null || _a === void 0 ? void 0 : _a.environment) || "development"}`);
    if ((_b = config_1.default.frontend) === null || _b === void 0 ? void 0 : _b.url) {
        logger_1.logger.info(`Frontend URL: ${config_1.default.frontend.url}`);
    }
});
exports.default = app;
