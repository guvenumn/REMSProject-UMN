// src/routes/messageRoutes.ts
import express from "express";
import * as messageController from "../controllers/messageController";
import * as inquiryController from "../controllers/inquiryController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations
router.get("/conversations", messageController.getConversations);

// Get unread message count
router.get("/unread", messageController.getUnreadMessageCount);

// Get a specific conversation
router.get("/conversations/:id", messageController.getConversation);

// Get messages in a conversation
router.get("/conversations/:id/messages", messageController.getMessages);

// Send a message to a conversation
router.post("/conversations/:id/messages", messageController.sendMessage);

// Mark conversation as read
router.post(
  "/conversations/:id/read",
  messageController.markConversationAsRead
);

// Archive a conversation
router.post(
  "/conversations/:id/archive",
  messageController.archiveConversation
);

// Start a new conversation
router.post("/conversations", messageController.startConversation);

// Update conversation status
router.put(
  "/conversations/:id/status",
  messageController.updateConversationStatus
);

// Create a property inquiry
router.post("/inquiries", inquiryController.createInquiry);

// Update inquiry status
router.post("/inquiries/:id/status", inquiryController.updateInquiryStatus);

export default router;
