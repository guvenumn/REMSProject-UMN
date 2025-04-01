// Path: /backend/src/utils/errors.ts
/**
 * Base API Error class
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error class
 * Note: This was missing and is referenced in auth.ts
 */
export class AuthError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

/**
 * Validation Error class for handling validation failures
 */
export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authorization Error class
 */
export class AuthorizationError extends ApiError {
  constructor(
    message: string = "You don't have permission to access this resource"
  ) {
    super(message, 403);
  }
}

/**
 * Not Found Error class
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Conflict Error class
 */
export class ConflictError extends ApiError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Bad Request Error class
 */
export class BadRequestError extends ApiError {
  constructor(message: string = "Bad request") {
    super(message, 400);
  }
}

/**
 * Internal Server Error class
 */
export class InternalServerError extends ApiError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}