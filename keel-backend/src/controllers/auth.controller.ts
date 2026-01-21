//keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Role from "../models/Role";

/**
 * Authentication Controller
 * Handles Login, Password Management, and Profile Updates.
 */

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;
  const email = String(rawEmail || "").trim().toLowerCase();
  const password = String(rawPassword || "").trim();

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // --- FIX: INCLUDE COMPANY ID IN TOKEN ---
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role?.name,
        company_id: user.company_id // <--- CRITICAL ADDITION
      },
      process.env.JWT_SECRET || "maritime_secret_key",
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name,
        companyId: user.company_id, // Send to frontend too
        rank: user.rank,
        cocNumber: user.coc_number,
        seamanBookNumber: user.seaman_book_number,
        mfaEnabled: user.mfa_enabled
      },
    });
  } catch (error) {
    console.error("❌ AUTH LOGIN ERROR:", error);
    return res.status(500).json({ message: "System error." });
  }
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password_hash = newHash;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password." });
  }
};

// --- UPDATE PROFILE ---
export const updateProfile = async (req: Request, res: Response) => {
  const { userId, cocNumber, seamanBookNumber, mfaEnabled } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (cocNumber !== undefined) user.coc_number = cocNumber;
    if (seamanBookNumber !== undefined) user.seaman_book_number = seamanBookNumber;
    if (mfaEnabled !== undefined) user.mfa_enabled = mfaEnabled;

    await user.save();

    res.json({ 
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name || 'Unknown',
        cocNumber: user.coc_number,
        seamanBookNumber: user.seaman_book_number,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// --- CREATE USER (Helper) ---
export const createUser = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // @ts-ignore
    const currentUser = req.user; 

    let targetCompanyId = currentUser.company_id;

    if (currentUser.role === 'SUPER_ADMIN' && data.companyId) {
        targetCompanyId = data.companyId;
    }

    const newUser = await User.create({
      email: data.email,
      password_hash: await bcrypt.hash(data.password || 'Keel@123', 10),
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId, 
      company_id: targetCompanyId, 
      status: 'Active'
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};