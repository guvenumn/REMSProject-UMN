"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const propertyController_1 = require("../controllers/propertyController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = config_1.default.upload.propertiesDir ||
            path_1.default.join(process.cwd(), "uploads/properties");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `property-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed."));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.get("/search", propertyController_1.searchProperties);
router.get("/", propertyController_1.getAllProperties);
router.get("/featured", propertyController_1.getFeaturedProperties);
router.get("/:id", propertyController_1.getPropertyById);
router.get("/:id/similar", propertyController_1.getSimilarProperties);
router.get("/agent/:agentId", propertyController_1.getPropertiesByAgent);
router.get("/:id/price-history", propertyController_1.getPropertyPriceHistory);
router.use(authMiddleware_1.authenticate);
router.post("/", propertyController_1.createProperty);
router.put("/:id", propertyController_1.updateProperty);
router.delete("/:id", propertyController_1.deleteProperty);
router.post("/:id/price-history", propertyController_1.addPriceHistoryEntry);
router.post("/:id/images", upload.array("images", 10), propertyController_1.uploadPropertyImages);
exports.default = router;
