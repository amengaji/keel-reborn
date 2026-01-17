// keel-reborn/keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import User from "../models/User";
import Role from "../models/Role";

/**
 * Authentication Controller
 * -------------------------
 * Responsible for validating credentials and issuing JWT tokens.
 * Passwords are validated using bcrypt hash comparison.
 */

export const login = async (req: Request, res: Response) => {
  // const { email, password } = req.body as {
  //   email?: string;
  //   password?: string;
  // };
const rawEmail = req.body?.email;
const rawPassword = req.body?.password;

const email = String(rawEmail || "").trim().toLowerCase();
const password = String(rawPassword || "").trim();

  try {
    // ------------------------------------------------------------------
    // 1. Validate request payload
    // ------------------------------------------------------------------
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // ------------------------------------------------------------------
    // 2. Find user and include role
    // ------------------------------------------------------------------
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials. Please check your email and password.",
      });
    }

    // ------------------------------------------------------------------
    // 3. Validate password (bcrypt)
    // ------------------------------------------------------------------
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    // ------------------------------------------------------------------
    // 4. Generate JWT access token
    // ------------------------------------------------------------------
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role?.name,
      },
      process.env.JWT_SECRET || "maritime_secret_key",
      {
        expiresIn: "8h",
      }
    );

    // ------------------------------------------------------------------
    // 5. Success response (aligned with mobile app expectations)
    // ------------------------------------------------------------------
    return res.status(200).json({
      accessToken,
      refreshToken: accessToken, // placeholder until refresh-token flow is implemented
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name,
      },
    });
  } catch (error) {
    console.error("❌ AUTH LOGIN ERROR:", error);

    return res.status(500).json({
      message: "A system error occurred during login. Please try again.",
    });
  }
};
