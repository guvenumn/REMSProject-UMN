"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["HTTP"] = 3] = "HTTP";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
})(LogLevel || (LogLevel = {}));
const getCurrentLevel = () => {
    const env = process.env.NODE_ENV || "development";
    if (env === "development") {
        return LogLevel.DEBUG;
    }
    return LogLevel.INFO;
};
const currentLevel = getCurrentLevel();
const formatLogMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
};
exports.logger = {
    error: (message, ...args) => {
        if (currentLevel >= LogLevel.ERROR) {
            console.error(formatLogMessage("ERROR", String(message)), ...args);
        }
    },
    warn: (message, ...args) => {
        if (currentLevel >= LogLevel.WARN) {
            console.warn(formatLogMessage("WARN", String(message)), ...args);
        }
    },
    info: (message, ...args) => {
        if (currentLevel >= LogLevel.INFO) {
            console.info(formatLogMessage("INFO", String(message)), ...args);
        }
    },
    http: (message, ...args) => {
        if (currentLevel >= LogLevel.HTTP) {
            console.log(formatLogMessage("HTTP", String(message)), ...args);
        }
    },
    debug: (message, ...args) => {
        if (currentLevel >= LogLevel.DEBUG) {
            console.debug(formatLogMessage("DEBUG", String(message)), ...args);
        }
    },
};
