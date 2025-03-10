// Path: /backend/src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Validation middleware that uses Joi schemas
 * @param schema - Joi schema to validate request body against
 * @returns Express middleware function
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        throw new BadRequestError("Validation error", errors);
      }

      // Replace req.body with validated value
      req.body = value;
      next();
    } catch (err) {
      logger.error(`Validation error: ${err}`);
      next(err);
    }
  };
};

/**
 * Validation middleware for query parameters
 * @param schema - Joi schema to validate request query against
 * @returns Express middleware function
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        throw new BadRequestError(
          "Validation error in query parameters",
          errors
        );
      }

      // Replace req.query with validated value (as any because req.query is readonly)
      req.query = value as any;
      next();
    } catch (err) {
      logger.error(`Query validation error: ${err}`);
      next(err);
    }
  };
};

/**
 * Validation middleware for URL parameters
 * @param schema - Joi schema to validate request params against
 * @returns Express middleware function
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        throw new BadRequestError("Validation error in URL parameters", errors);
      }

      // Replace req.params with validated value (as any because req.params is readonly)
      req.params = value as any;
      next();
    } catch (err) {
      logger.error(`Params validation error: ${err}`);
      next(err);
    }
  };
};
