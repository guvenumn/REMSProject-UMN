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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController = __importStar(require("../controllers/messageController"));
const inquiryController = __importStar(require("../controllers/inquiryController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticate);
router.get("/conversations", messageController.getConversations);
router.get("/unread", messageController.getUnreadMessageCount);
router.get("/conversations/:id", messageController.getConversation);
router.get("/conversations/:id/messages", messageController.getMessages);
router.post("/conversations/:id/messages", messageController.sendMessage);
router.post("/conversations/:id/read", messageController.markConversationAsRead);
router.post("/conversations/:id/archive", messageController.archiveConversation);
router.post("/conversations", messageController.startConversation);
router.put("/conversations/:id/status", messageController.updateConversationStatus);
router.post("/inquiries", inquiryController.createInquiry);
router.post("/inquiries/:id/status", inquiryController.updateInquiryStatus);
exports.default = router;
