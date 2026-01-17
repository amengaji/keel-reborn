// keel-reborn/keel-backend/src/routes/auth.routes.ts

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { login } from "../controllers/auth.controller";
import User from "../models/User";

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


export default router;
