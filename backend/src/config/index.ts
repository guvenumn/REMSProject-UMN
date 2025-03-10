// file: /var/www/rems/backend/src/config/index.ts

import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  app: {
    port: process.env.PORT || 3002,
    environment: process.env.NODE_ENV || "development",
    rootDir: process.cwd(),
  },
  db: {
    url:
      process.env.DATABASE_URL ||
      "postgres://remsdbu:rems@db25@localhost:5432/remsdb",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-min-32-chars-long",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d", // 7 days
    resetTokenExpiresIn: 3600000, // 1 hour in milliseconds
    bcrypt: {
      saltRounds: 10,
    },
  },
  upload: {
    imagesDir: path.join(process.cwd(), "uploads", "images"),
    avatarsDir: path.join(process.cwd(), "uploads", "avatars"),
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || path.join(process.cwd(), "logs", "app.log"),
  },
};

export default config;
