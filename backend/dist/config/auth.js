"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development",
    jwtExpiresIn: "7d",
    resetTokenExpiresIn: 24 * 60 * 60 * 1000,
    minPasswordLength: 8,
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    bcrypt: {
        saltRounds: 12,
    },
};
exports.default = config;
