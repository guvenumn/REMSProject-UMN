// Path: /backend/src/routes/index.ts

import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import usersRoutes from "./usersRoutes";
import propertyRoutes from "./propertyRoutes";
import imageRoutes from "./imageRoutes";
import messageRoutes from "./messageRoutes";
import profileRoutes from "./profileRoutes";
//import uploadRoutes from "./uploadRoutes";
import searchRoutes from "./searchRoutes";
import inquiryRoutes from "./inquiryRoutes";
import dashboardRoutes from "./dashboardRoutes";
import adminRoutes from "./adminRoutes"; // Add the admin routes
import healthRoutes from "./healthRoutes"; // Add the health routes
import { logger } from "../utils/logger";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/users", usersRoutes);
router.use("/properties", propertyRoutes);
router.use("/images", imageRoutes);
router.use("/messages", messageRoutes);
router.use("/profile", profileRoutes);
//router.use("/upload", uploadRoutes);
router.use("/search", searchRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes); // Add admin routes
router.use("/health", healthRoutes); // Add health routes

export default router;
