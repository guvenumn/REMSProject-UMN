"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const errorMiddleware = (err, req, res, next) => {
    logger_1.logger.error(`Error: ${err.message}`, { stack: err.stack });
    if (err instanceof errors_1.ApiError) {
        const response = {
            success: false,
            message: err.message,
        };
        if ("errors" in err && err.errors) {
            response.errors = err.errors;
        }
        return res.status(err.statusCode).json(response);
    }
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
exports.default = errorMiddleware;
