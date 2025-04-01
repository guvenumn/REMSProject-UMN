// src/controllers/inquiryController.ts
import { Request, Response, NextFunction } from "express";
import InquiryService from "../services/inquiryService";
import { ApiError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import { UserRole } from "../types/user";

/**
 * Get inquiries with pagination and filtering
 */
export const getInquiries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Type guards for user
    if (!req.user || !req.userRole) {
      throw new ApiError("User information is missing", 401);
    }

    // Parse query parameters
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await InquiryService.getInquiries(
      req.userId,
      req.userRole,
      filters
    );

    logger.info(
      `Retrieved ${result.inquiries.length} inquiries for user ${req.userId}`
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Error retrieving inquiries: ${error}`);
    next(error);
  }
};

/**
 * Get inquiry by ID
 */
export const getInquiryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Type guards for user
    if (!req.user || !req.userRole) {
      throw new ApiError("User information is missing", 401);
    }

    const { id } = req.params;

    const inquiry = await InquiryService.getInquiryById(
      id,
      req.userId,
      req.userRole
    );

    logger.info(`Retrieved inquiry ${id} for user ${req.userId}`);

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    logger.error(`Error retrieving inquiry: ${error}`);
    next(error);
  }
};

/**
 * Create a new inquiry
 */
export const createInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    const { propertyId, message } = req.body;

    if (!propertyId || !message) {
      throw new BadRequestError("Property ID and message are required");
    }

    const result = await InquiryService.createInquiry(
      req.userId,
      propertyId,
      message
    );

    logger.info(
      `Created inquiry for property ${propertyId} by user ${req.userId}`
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Error creating inquiry: ${error}`);
    next(error);
  }
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Type guards for user
    if (!req.user || !req.userRole) {
      throw new ApiError("User information is missing", 401);
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
      throw new BadRequestError("Invalid status");
    }

    const updatedInquiry = await InquiryService.updateInquiryStatus(
      id,
      status as "NEW" | "RESPONDED" | "CLOSED",
      req.userId,
      req.userRole
    );

    logger.info(
      `Updated inquiry ${id} status to ${status} by user ${req.userId}`
    );

    res.status(200).json({
      success: true,
      data: updatedInquiry,
    });
  } catch (error) {
    logger.error(`Error updating inquiry status: ${error}`);
    next(error);
  }
};

/**
 * Respond to an inquiry
 */
export const respondToInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new ApiError("Authentication required", 401);
    }

    // Type guards for user
    if (!req.user || !req.userRole) {
      throw new ApiError("User information is missing", 401);
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      throw new BadRequestError("Response message is required");
    }

    const result = await InquiryService.respondToInquiry(
      id,
      message.trim(),
      req.userId,
      req.userRole
    );

    logger.info(`Responded to inquiry ${id} by user ${req.userId}`);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Error responding to inquiry: ${error}`);
    next(error);
  }
};
