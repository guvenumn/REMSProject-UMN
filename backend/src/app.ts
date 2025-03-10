// Path: /var/www/rems/backend/src/app.ts

import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import config from "./config";
import { ApiError } from "./utils/errors";
import { logger } from "./utils/logger";
import routes from "./routes/index";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma
const prisma = new PrismaClient();

const app = express();

// Port configuration - ensure it's a number
const portValue = process.env.PORT || (config.app && config.app.port) || 3002;
const port =
  typeof portValue === "string" ? parseInt(portValue, 10) : portValue;

// Configure CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://remsproject.com",
  "https://www.remsproject.com",
  // Add any other domains that need access
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        logger.warn(`CORS blocked request from: ${origin}`);
        return callback(null, false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), { maxAge: "1d" })
);

// API Routes
app.use("/api", routes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
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

// Start server - listen on all network interfaces
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to database');
    
    app.listen(port, "0.0.0.0", () => {
      logger.info(`Server running on port ${port} - http://127.0.0.1:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export { app, prisma };