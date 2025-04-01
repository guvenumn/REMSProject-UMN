// Path: /backend/src/routes/propertyRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  searchProperties,
  getAllProperties,
  getPropertyById,
  getSimilarProperties,
  getFeaturedProperties,
  getPropertiesByAgent,
  getPropertyPriceHistory,
  createProperty,
  updateProperty,
  deleteProperty,
  addPriceHistoryEntry,
  uploadPropertyImages,
} from "../controllers/propertyController";
import multer from "multer";
import path from "path";
import fs from "fs";
import config from "../config";

const router = Router();

// Configure multer for property image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      (config.upload as any).propertiesDir ||
      path.join(process.cwd(), "uploads/properties");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `property-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}${ext}`;
    cb(null, filename);
  },
});

// File filter for image uploads
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Public routes
// -------------

// Search properties
router.get("/search", searchProperties);

// Get all properties with filtering
router.get("/", getAllProperties);

// Get featured properties
router.get("/featured", getFeaturedProperties);

// Get property by ID
router.get("/:id", getPropertyById);

// Get similar properties
router.get("/:id/similar", getSimilarProperties);

// Get properties by agent
router.get("/agent/:agentId", getPropertiesByAgent);

// Get property price history
router.get("/:id/price-history", getPropertyPriceHistory);

// Protected routes (require authentication)
// -------------
router.use(authenticate);

// Create a new property
router.post("/", createProperty);

// Update a property
router.put("/:id", updateProperty);

// Delete a property
router.delete("/:id", deleteProperty);

// Add price history entry
router.post("/:id/price-history", addPriceHistoryEntry);

// Upload property images
router.post("/:id/images", upload.array("images", 10), uploadPropertyImages);

// Remove routes with missing controller functions
// Note: The following functions would need to be implemented in the controller:
// - getFavoriteProperties
// - toggleFavorite
// - createPropertyInquiry
// - deletePropertyImage

export default router;
