"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        const uploadDir = path_1.default.join(process.cwd(), "uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (_req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed!"));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.post("/upload", upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
        }
        else {
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
    }
    catch (error) {
        res.status(500).json({ error: "Error uploading file" });
    }
});
router.post("/upload-multiple", upload.array("images", 10), (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ error: "No files uploaded" });
        }
        else {
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
    }
    catch (error) {
        res.status(500).json({ error: "Error uploading files" });
    }
});
exports.default = router;
