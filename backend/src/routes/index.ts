// src/routes/index.ts

import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import usersRoutes from "./usersRoutes";
// import propertyRoutes from "./propertyRoutes";
// import imageRoutes from "./imageRoutes";
// import messageRoutes from "./messageRoutes";
import profileRoutes from "./profileRoutes";
//import uploadRoutes from "./uploadRoutes";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/users", usersRoutes);
// router.use("/properties", propertyRoutes);
// router.use("/images", imageRoutes);
// router.use("/messages", messageRoutes);
router.use("/profile", profileRoutes);
//router.use("/upload", uploadRoutes);

export default router;
