// file: rems/backend/src/routes/imageRoutes.ts
import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter to only accept image files
const fileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload a single image
router.post(
  "/upload",
  upload.single("image"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
      } else {
        res.status(200).json({
          success: true,
          file: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size,
            mimetype: req.file.mimetype,
          },
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Error uploading file" });
    }
  }
);

// Upload multiple images
router.post(
  "/upload-multiple",
  upload.array("images", 10),
  (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
      } else {
        const fileDetails = req.files.map((file) => ({
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
        }));

        res.status(200).json({
          success: true,
          files: fileDetails,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Error uploading files" });
    }
  }
);

export default router;
