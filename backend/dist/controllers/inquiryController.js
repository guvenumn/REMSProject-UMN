"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToInquiry = exports.updateInquiryStatus = exports.createInquiry = exports.getInquiryById = exports.getInquiries = void 0;
const inquiryService_1 = __importDefault(require("../services/inquiryService"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const getInquiries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        if (!req.user || !req.userRole) {
            throw new errors_1.ApiError("User information is missing", 401);
        }
        const filters = {
            status: req.query.status,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
        };
        const result = yield inquiryService_1.default.getInquiries(req.userId, req.userRole, filters);
        logger_1.logger.info(`Retrieved ${result.inquiries.length} inquiries for user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving inquiries: ${error}`);
        next(error);
    }
});
exports.getInquiries = getInquiries;
const getInquiryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        if (!req.user || !req.userRole) {
            throw new errors_1.ApiError("User information is missing", 401);
        }
        const { id } = req.params;
        const inquiry = yield inquiryService_1.default.getInquiryById(id, req.userId, req.userRole);
        logger_1.logger.info(`Retrieved inquiry ${id} for user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: inquiry,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving inquiry: ${error}`);
        next(error);
    }
});
exports.getInquiryById = getInquiryById;
const createInquiry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { propertyId, message } = req.body;
        if (!propertyId || !message) {
            throw new errors_1.BadRequestError("Property ID and message are required");
        }
        const result = yield inquiryService_1.default.createInquiry(req.userId, propertyId, message);
        logger_1.logger.info(`Created inquiry for property ${propertyId} by user ${req.userId}`);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error creating inquiry: ${error}`);
        next(error);
    }
});
exports.createInquiry = createInquiry;
const updateInquiryStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        if (!req.user || !req.userRole) {
            throw new errors_1.ApiError("User information is missing", 401);
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["NEW", "RESPONDED", "CLOSED"].includes(status)) {
            throw new errors_1.BadRequestError("Invalid status");
        }
        const updatedInquiry = yield inquiryService_1.default.updateInquiryStatus(id, status, req.userId, req.userRole);
        logger_1.logger.info(`Updated inquiry ${id} status to ${status} by user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: updatedInquiry,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating inquiry status: ${error}`);
        next(error);
    }
});
exports.updateInquiryStatus = updateInquiryStatus;
const respondToInquiry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        if (!req.user || !req.userRole) {
            throw new errors_1.ApiError("User information is missing", 401);
        }
        const { id } = req.params;
        const { message } = req.body;
        if (!message || !message.trim()) {
            throw new errors_1.BadRequestError("Response message is required");
        }
        const result = yield inquiryService_1.default.respondToInquiry(id, message.trim(), req.userId, req.userRole);
        logger_1.logger.info(`Responded to inquiry ${id} by user ${req.userId}`);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error responding to inquiry: ${error}`);
        next(error);
    }
});
exports.respondToInquiry = respondToInquiry;
