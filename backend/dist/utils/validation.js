"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const errors_1 = require("./errors");
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));
            const errorMessage = `Validation error: ${errors
                .map((e) => `${e.field}: ${e.message}`)
                .join(", ")}`;
            throw new errors_1.BadRequestError(errorMessage);
        }
        next();
    };
};
exports.validate = validate;
const userRegistration = joi_1.default.object({
    name: joi_1.default.string().required().trim().min(2).max(100).messages({
        "string.empty": "Name cannot be empty",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
        "any.required": "Name is required",
    }),
    email: joi_1.default.string().email().required().trim().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string()
        .required()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
    }),
    phone: joi_1.default.string().optional().trim(),
    role: joi_1.default.string().valid("USER", "AGENT", "ADMIN").default("USER"),
});
const userLogin = joi_1.default.object({
    email: joi_1.default.string().email().required().trim().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required",
    }),
});
const userProfileUpdate = joi_1.default.object({
    name: joi_1.default.string().optional().trim().min(2).max(100).messages({
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
    }),
    phone: joi_1.default.string().optional().trim(),
    bio: joi_1.default.string().optional().trim().max(500).messages({
        "string.max": "Bio cannot exceed 500 characters",
    }),
    company: joi_1.default.string().optional().trim().max(100).messages({
        "string.max": "Company name cannot exceed 100 characters",
    }),
    address: joi_1.default.string().optional().trim().max(200).messages({
        "string.max": "Address cannot exceed 200 characters",
    }),
    socialLinks: joi_1.default.object().optional(),
});
const userUpdate = joi_1.default.object({
    name: joi_1.default.string().optional().trim().min(2).max(100),
    email: joi_1.default.string().email().optional().trim(),
    phone: joi_1.default.string().optional().trim(),
    role: joi_1.default.string().valid("USER", "AGENT", "ADMIN").optional(),
    isActive: joi_1.default.boolean().optional(),
});
const passwordResetRequest = joi_1.default.object({
    email: joi_1.default.string().email().required().trim().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
    }),
});
const passwordReset = joi_1.default.object({
    token: joi_1.default.string().required().trim().messages({
        "string.empty": "Reset token cannot be empty",
        "any.required": "Reset token is required",
    }),
    password: joi_1.default.string()
        .required()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
    }),
});
const passwordChange = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        "string.empty": "Current password cannot be empty",
        "any.required": "Current password is required",
    }),
    newPassword: joi_1.default.string()
        .required()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
        "string.empty": "New password cannot be empty",
        "string.min": "New password must be at least 8 characters long",
        "string.pattern.base": "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "New password is required",
    }),
});
const messageCreate = joi_1.default.object({
    content: joi_1.default.string().required().trim().min(1).max(1000).messages({
        "string.empty": "Message content cannot be empty",
        "string.min": "Message content must be at least 1 character long",
        "string.max": "Message content cannot exceed 1000 characters",
        "any.required": "Message content is required",
    }),
    attachments: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
});
const conversationCreate = joi_1.default.object({
    recipientId: joi_1.default.string().required().trim().messages({
        "string.empty": "Recipient ID cannot be empty",
        "any.required": "Recipient ID is required",
    }),
    initialMessage: joi_1.default.string().required().trim().min(1).max(1000).messages({
        "string.empty": "Initial message cannot be empty",
        "string.min": "Initial message must be at least 1 character long",
        "string.max": "Initial message cannot exceed 1000 characters",
        "any.required": "Initial message is required",
    }),
    propertyId: joi_1.default.string().optional().trim(),
    title: joi_1.default.string().optional().trim().max(100).messages({
        "string.max": "Subject cannot exceed 100 characters",
    }),
});
const propertyCreate = joi_1.default.object({
    title: joi_1.default.string().required().trim().min(3).max(200).messages({
        "string.empty": "Title cannot be empty",
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title cannot exceed 200 characters",
        "any.required": "Title is required",
    }),
    description: joi_1.default.string().required().trim().min(10).messages({
        "string.empty": "Description cannot be empty",
        "string.min": "Description must be at least 10 characters long",
        "any.required": "Description is required",
    }),
    price: joi_1.default.number().required().positive().messages({
        "number.base": "Price must be a number",
        "number.positive": "Price must be positive",
        "any.required": "Price is required",
    }),
    size: joi_1.default.number().required().positive().messages({
        "number.base": "Size must be a number",
        "number.positive": "Size must be positive",
        "any.required": "Size is required",
    }),
    rooms: joi_1.default.number().required().integer().min(0).messages({
        "number.base": "Rooms must be a number",
        "number.integer": "Rooms must be an integer",
        "number.min": "Rooms cannot be negative",
        "any.required": "Rooms is required",
    }),
    bathrooms: joi_1.default.number().required().integer().min(0).messages({
        "number.base": "Bathrooms must be a number",
        "number.integer": "Bathrooms must be an integer",
        "number.min": "Bathrooms cannot be negative",
        "any.required": "Bathrooms is required",
    }),
    location: joi_1.default.string().required().trim().messages({
        "string.empty": "Location cannot be empty",
        "any.required": "Location is required",
    }),
    address: joi_1.default.string().required().trim().messages({
        "string.empty": "Address cannot be empty",
        "any.required": "Address is required",
    }),
    status: joi_1.default.string()
        .valid("AVAILABLE", "PENDING", "SOLD", "RENTED")
        .required()
        .messages({
        "any.only": "Status must be one of: AVAILABLE, PENDING, SOLD, RENTED",
        "any.required": "Status is required",
    }),
    latitude: joi_1.default.number().optional().messages({
        "number.base": "Latitude must be a number",
    }),
    longitude: joi_1.default.number().optional().messages({
        "number.base": "Longitude must be a number",
    }),
    features: joi_1.default.array().items(joi_1.default.string()).optional(),
});
const propertyUpdate = joi_1.default.object({
    title: joi_1.default.string().optional().trim().min(3).max(200).messages({
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title cannot exceed 200 characters",
    }),
    description: joi_1.default.string().optional().trim().min(10).messages({
        "string.min": "Description must be at least 10 characters long",
    }),
    price: joi_1.default.number().optional().positive().messages({
        "number.base": "Price must be a number",
        "number.positive": "Price must be positive",
    }),
    size: joi_1.default.number().optional().positive().messages({
        "number.base": "Size must be a number",
        "number.positive": "Size must be positive",
    }),
    rooms: joi_1.default.number().optional().integer().min(0).messages({
        "number.base": "Rooms must be a number",
        "number.integer": "Rooms must be an integer",
        "number.min": "Rooms cannot be negative",
    }),
    bathrooms: joi_1.default.number().optional().integer().min(0).messages({
        "number.base": "Bathrooms must be a number",
        "number.integer": "Bathrooms must be an integer",
        "number.min": "Bathrooms cannot be negative",
    }),
    location: joi_1.default.string().optional().trim(),
    address: joi_1.default.string().optional().trim(),
    status: joi_1.default.string()
        .valid("AVAILABLE", "PENDING", "SOLD", "RENTED")
        .optional()
        .messages({
        "any.only": "Status must be one of: AVAILABLE, PENDING, SOLD, RENTED",
    }),
    latitude: joi_1.default.number().optional().messages({
        "number.base": "Latitude must be a number",
    }),
    longitude: joi_1.default.number().optional().messages({
        "number.base": "Longitude must be a number",
    }),
    features: joi_1.default.array().items(joi_1.default.string()).optional(),
});
const propertyInquiry = joi_1.default.object({
    message: joi_1.default.string().required().trim().min(10).max(1000).messages({
        "string.empty": "Message cannot be empty",
        "string.min": "Message must be at least 10 characters long",
        "string.max": "Message cannot exceed 1000 characters",
        "any.required": "Message is required",
    }),
});
exports.schemas = {
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
