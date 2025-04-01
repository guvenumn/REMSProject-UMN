"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const inquiryController_1 = require("../controllers/inquiryController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticate);
router.get("/", inquiryController_1.getInquiries);
router.get("/:id", inquiryController_1.getInquiryById);
router.put("/:id", inquiryController_1.updateInquiryStatus);
router.post("/:id/respond", inquiryController_1.respondToInquiry);
router.post("/", inquiryController_1.createInquiry);
exports.default = router;
