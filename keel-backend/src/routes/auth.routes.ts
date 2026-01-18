// keel-reborn/keel-backend/src/routes/auth.routes.ts

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { login, changePassword, updateProfile } from "../controllers/auth.controller";

/**
 * Authentication Routes
 * ---------------------
 * Handles login and (temporary) admin password reset.
 */

const router = Router();

// ---------------------------------------------------------------------
// Login
// URL: POST /api/auth/login
// ---------------------------------------------------------------------
router.post("/login", login);
router.post("/change-password", changePassword);
router.put("/profile", updateProfile);

export default router;
