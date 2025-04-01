// /var/www/rems/backend/src/app.ts
import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import http from "http";
import config from "./config";
import { ApiError } from "./utils/errors";
import { logger } from "./utils/logger";
import routes from "./routes/index";
import { initializeSocketServer } from "./websocket";
import healthRoutes from "./routes/healthRoutes";

const app = express();

// Port configuration - ensure it's a number
const portValue = process.env.PORT || (config.app && config.app.port) || 3001;
const port =
  typeof portValue === "string" ? parseInt(portValue, 10) : portValue;

// Configure CORS - Handle both string and array origins
const corsOrigin = config.cors?.origin || "*";
const allowedOrigins = Array.isArray(corsOrigin) 
  ? corsOrigin 
  : (corsOrigin === "*" ? "*" : [corsOrigin]);

// Setup CORS middleware
if (allowedOrigins === "*") {
  app.use(cors({
    origin: "*",
    credentials: config.cors?.credentials || true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
} else {
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          logger.warn(`CORS blocked request from: ${origin}`);
          return callback(null, false);
        }
        return callback(null, true);
      },
      credentials: config.cors?.credentials || true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging - Only use morgan if installed
try {
  const morgan = require("morgan");
  app.use(morgan("combined"));
} catch (err) {
  logger.warn("Morgan logger not available, continuing without it");
}

// Serve static files from uploads directory
const uploadsPath =
  config.upload?.baseDir || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath, { maxAge: "1d" }));

// API Routes
app.use("/api", routes);

// Health check routes - Register both at root and under /api for flexibility
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Legacy health check route for backwards compatibility
app.get("/health-legacy", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.app?.environment || "development",
  });
});

// Error middleware using ErrorRequestHandler type
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err instanceof ApiError) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errors: (err as any).errors, // Cast to any to avoid TS error
    });
    return; // Return nothing (void)
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocketServer(app, server);

// Start server - listen on all network interfaces or config host
const host = config.app?.host || "0.0.0.0";
server.listen(port, host, () => {
  logger.info(
    `Server running on port ${port} - http://${
      host === "0.0.0.0" ? "localhost" : host
    }:${port}`
  );
  logger.info(`Environment: ${config.app?.environment || "development"}`);
  if (config.frontend?.url) {
    logger.info(`Frontend URL: ${config.frontend.url}`);
  }
});

export default app;
