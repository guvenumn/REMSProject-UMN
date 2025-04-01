"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const searchController_1 = require("../controllers/searchController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get("/", searchController_1.searchAll);
exports.default = router;
