// Path: /backend/src/utils/validation.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { BadRequestError } from "./errors";

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      // The error is in this line - BadRequestError expects different parameters
      // We'll use a more flexible approach that should work with different implementations
      const errorMessage = `Validation error: ${errors
        .map((e) => `${e.field}: ${e.message}`)
        .join(", ")}`;
      throw new BadRequestError(errorMessage);
    }

    next();
  };
};

// User registration schema
const userRegistration = Joi.object({
  name: Joi.string().required().trim().min(2).max(100).messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().trim().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "Password is required",
    }),
  phone: Joi.string().optional().trim(),
  role: Joi.string().valid("USER", "AGENT", "ADMIN").default("USER"),
});

// User login schema
const userLogin = Joi.object({
  email: Joi.string().email().required().trim().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be empty",
    "any.required": "Password is required",
  }),
});

// User profile update schema
const userProfileUpdate = Joi.object({
  name: Joi.string().optional().trim().min(2).max(100).messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
  }),
  phone: Joi.string().optional().trim(),
  bio: Joi.string().optional().trim().max(500).messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),
  company: Joi.string().optional().trim().max(100).messages({
    "string.max": "Company name cannot exceed 100 characters",
  }),
  address: Joi.string().optional().trim().max(200).messages({
    "string.max": "Address cannot exceed 200 characters",
  }),
  socialLinks: Joi.object().optional(),
});

// User update schema (for admins)
const userUpdate = Joi.object({
  name: Joi.string().optional().trim().min(2).max(100),
  email: Joi.string().email().optional().trim(),
  phone: Joi.string().optional().trim(),
  role: Joi.string().valid("USER", "AGENT", "ADMIN").optional(),
  isActive: Joi.boolean().optional(),
});

// Password reset request schema
const passwordResetRequest = Joi.object({
  email: Joi.string().email().required().trim().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
});

// Password reset schema
const passwordReset = Joi.object({
  token: Joi.string().required().trim().messages({
    "string.empty": "Reset token cannot be empty",
    "any.required": "Reset token is required",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "Password is required",
    }),
});

// Password change schema
const passwordChange = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password cannot be empty",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.empty": "New password cannot be empty",
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "New password is required",
    }),
});

// Message creation schema
const messageCreate = Joi.object({
  content: Joi.string().required().trim().min(1).max(1000).messages({
    "string.empty": "Message content cannot be empty",
    "string.min": "Message content must be at least 1 character long",
    "string.max": "Message content cannot exceed 1000 characters",
    "any.required": "Message content is required",
  }),
  attachments: Joi.array().items(Joi.string().uri()).optional(),
});

// Conversation creation schema
const conversationCreate = Joi.object({
  recipientId: Joi.string().required().trim().messages({
    "string.empty": "Recipient ID cannot be empty",
    "any.required": "Recipient ID is required",
  }),
  initialMessage: Joi.string().required().trim().min(1).max(1000).messages({
    "string.empty": "Initial message cannot be empty",
    "string.min": "Initial message must be at least 1 character long",
    "string.max": "Initial message cannot exceed 1000 characters",
    "any.required": "Initial message is required",
  }),
  propertyId: Joi.string().optional().trim(),
  title: Joi.string().optional().trim().max(100).messages({
    "string.max": "Subject cannot exceed 100 characters",
  }),
});

// Property creation schema
const propertyCreate = Joi.object({
  title: Joi.string().required().trim().min(3).max(200).messages({
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().required().trim().min(10).messages({
    "string.empty": "Description cannot be empty",
    "string.min": "Description must be at least 10 characters long",
    "any.required": "Description is required",
  }),
  price: Joi.number().required().positive().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be positive",
    "any.required": "Price is required",
  }),
  size: Joi.number().required().positive().messages({
    "number.base": "Size must be a number",
    "number.positive": "Size must be positive",
    "any.required": "Size is required",
  }),
  rooms: Joi.number().required().integer().min(0).messages({
    "number.base": "Rooms must be a number",
    "number.integer": "Rooms must be an integer",
    "number.min": "Rooms cannot be negative",
    "any.required": "Rooms is required",
  }),
  bathrooms: Joi.number().required().integer().min(0).messages({
    "number.base": "Bathrooms must be a number",
    "number.integer": "Bathrooms must be an integer",
    "number.min": "Bathrooms cannot be negative",
    "any.required": "Bathrooms is required",
  }),
  location: Joi.string().required().trim().messages({
    "string.empty": "Location cannot be empty",
    "any.required": "Location is required",
  }),
  address: Joi.string().required().trim().messages({
    "string.empty": "Address cannot be empty",
    "any.required": "Address is required",
  }),
  status: Joi.string()
    .valid("AVAILABLE", "PENDING", "SOLD", "RENTED")
    .required()
    .messages({
      "any.only": "Status must be one of: AVAILABLE, PENDING, SOLD, RENTED",
      "any.required": "Status is required",
    }),
  latitude: Joi.number().optional().messages({
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().optional().messages({
    "number.base": "Longitude must be a number",
  }),
  features: Joi.array().items(Joi.string()).optional(),
});

// Property update schema
const propertyUpdate = Joi.object({
  title: Joi.string().optional().trim().min(3).max(200).messages({
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().optional().trim().min(10).messages({
    "string.min": "Description must be at least 10 characters long",
  }),
  price: Joi.number().optional().positive().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be positive",
  }),
  size: Joi.number().optional().positive().messages({
    "number.base": "Size must be a number",
    "number.positive": "Size must be positive",
  }),
  rooms: Joi.number().optional().integer().min(0).messages({
    "number.base": "Rooms must be a number",
    "number.integer": "Rooms must be an integer",
    "number.min": "Rooms cannot be negative",
  }),
  bathrooms: Joi.number().optional().integer().min(0).messages({
    "number.base": "Bathrooms must be a number",
    "number.integer": "Bathrooms must be an integer",
    "number.min": "Bathrooms cannot be negative",
  }),
  location: Joi.string().optional().trim(),
  address: Joi.string().optional().trim(),
  status: Joi.string()
    .valid("AVAILABLE", "PENDING", "SOLD", "RENTED")
    .optional()
    .messages({
      "any.only": "Status must be one of: AVAILABLE, PENDING, SOLD, RENTED",
    }),
  latitude: Joi.number().optional().messages({
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().optional().messages({
    "number.base": "Longitude must be a number",
  }),
  features: Joi.array().items(Joi.string()).optional(),
});

// Property inquiry schema
const propertyInquiry = Joi.object({
  message: Joi.string().required().trim().min(10).max(1000).messages({
    "string.empty": "Message cannot be empty",
    "string.min": "Message must be at least 10 characters long",
    "string.max": "Message cannot exceed 1000 characters",
    "any.required": "Message is required",
  }),
});

// Export all schemas
export const schemas = {
  userRegistration,
  userLogin,
  userProfileUpdate,
  userUpdate,
  passwordResetRequest,
  passwordReset,
  passwordChange,
  messageCreate,
  conversationCreate,
  propertyCreate,
  propertyUpdate,
  propertyInquiry,
};
