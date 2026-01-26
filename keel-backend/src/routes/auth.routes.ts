// keel-backend/src/routes/auth.routes.ts

import { Router } from "express";
import { 
  login, 
  getMe, // <--- IMPORT THIS
  changePassword, 
  updateProfile 
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * Authentication Routes
 * Base URL: /api/auth
 */

// 1. Public Routes
router.post("/login", login);

// 2. Protected Routes (Require Token)
router.get("/me", authenticate, getMe); // <--- ADD THIS (Fixes the 404)
router.post("/change-password", authenticate, changePassword);
router.put("/profile", authenticate, updateProfile);

export default router;