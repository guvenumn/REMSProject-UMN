"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStatus = exports.getAdminStats = exports.getRecentActivity = exports.getDashboardStats = void 0;
const dashboardService = __importStar(require("../services/dashboardService"));
const errors_1 = require("../utils/errors");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["AGENT"] = "AGENT";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
const getDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, role } = req.user;
        const stats = yield dashboardService.getDashboardStats(id, role);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
});
exports.getDashboardStats = getDashboardStats;
const getRecentActivity = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, role } = req.user;
        const limit = parseInt(req.query.limit) || 5;
        const activity = yield dashboardService.getRecentActivity(id, role, limit);
        res.json(activity);
    }
    catch (error) {
        next(error);
    }
});
exports.getRecentActivity = getRecentActivity;
const getAdminStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user.role !== UserRole.ADMIN) {
            throw new errors_1.ApiError("Unauthorized access to admin statistics", 403);
        }
        const stats = yield dashboardService.getAdminStats();
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
});
exports.getAdminStats = getAdminStats;
const getSystemStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user.role !== UserRole.ADMIN) {
            throw new errors_1.ApiError("Unauthorized access to system status", 403);
        }
        const status = yield dashboardService.getSystemStatus();
        res.json(status);
    }
    catch (error) {
        next(error);
    }
});
exports.getSystemStatus = getSystemStatus;
