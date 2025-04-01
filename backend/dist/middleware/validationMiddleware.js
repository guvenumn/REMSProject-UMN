"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const validateBody = (schema) => {
    return (req, res, next) => {
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
                throw new errors_1.BadRequestError("Validation error");
            }
            req.body = value;
            next();
        }
        catch (err) {
            logger_1.logger.error(`Validation error: ${err}`);
            next(err);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
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
                throw new errors_1.BadRequestError("Validation error in query parameters");
            }
            req.query = value;
            next();
        }
        catch (err) {
            logger_1.logger.error(`Query validation error: ${err}`);
            next(err);
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
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
                throw new errors_1.BadRequestError("Validation error in URL parameters");
            }
            req.params = value;
            next();
        }
        catch (err) {
            logger_1.logger.error(`Params validation error: ${err}`);
            next(err);
        }
    };
};
exports.validateParams = validateParams;
