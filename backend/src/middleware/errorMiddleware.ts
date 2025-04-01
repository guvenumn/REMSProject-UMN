// Path: /backend/src/middleware/errorMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";

// Error middleware
const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Check if it's our custom error
  if (err instanceof ApiError) {
    const response: {
      success: false;
      message: string;
      errors?: any;
    } = {
      success: false,
      message: err.message,
    };

    // Only add errors property if it exists
    if ("errors" in err && err.errors) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorMiddleware;
