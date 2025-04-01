// Path: /backend/src/routes/inquiryRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  respondToInquiry,
  createInquiry,
} from "../controllers/inquiryController";

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticate);

// GET /api/inquiries - Get all inquiries
router.get("/", getInquiries);

// GET /api/inquiries/:id - Get an inquiry by ID
router.get("/:id", getInquiryById);

// PUT /api/inquiries/:id - Update inquiry status
router.put("/:id", updateInquiryStatus);

// POST /api/inquiries/:id/respond - Respond to an inquiry
router.post("/:id/respond", respondToInquiry);

// POST /api/inquiries - Create a new inquiry
router.post("/", createInquiry);

export default router;
