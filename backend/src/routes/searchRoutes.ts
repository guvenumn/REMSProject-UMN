// Path: /backend/src/routes/searchRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { searchAll } from "../controllers/searchController";

const router = Router();

// Apply authentication middleware
router.use(authenticate);

// Define routes
router.get("/", searchAll);

export default router;
