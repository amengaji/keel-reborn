//keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Role from "../models/Role";
import Company from "../models/Company"; // Added for better data return

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
    console.log(`🔐 Login Attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 1. Find User
    // CRITICAL FIX: We explicitly ask for 'password_hash' because the model usually hides it.
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: "role" },
        { model: Company, as: "company" }
      ],
      attributes: [
        'id', 'email', 'password_hash', 'first_name', 'last_name', 
        'role_id', 'company_id', 'rank', 'status', 'avatar_url',
        'coc_number', 'seaman_book_number', 'mfa_enabled'
      ] 
    });

    if (!user) {
      console.log('❌ Login Failed: User not found.');
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.password_hash) {
      console.log('❌ Login Failed: Password hash missing in DB.');
      return res.status(401).json({ message: "Account setup incomplete. Contact Admin." });
    }

    // 2. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Login Failed: Password mismatch.');
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 3. Generate Token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role?.name,
        company_id: user.company_id 
      },
      process.env.JWT_SECRET || "maritime_secret_key",
      { expiresIn: "12h" }
    );

    console.log(`✅ Login Success: ${user.email} (${user.role?.name})`);

    // 4. Send Response
    return res.status(200).json({
      accessToken, // Matches frontend expectation (was 'token' in some versions, kept 'accessToken' as per your file)
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name,
        companyId: user.company_id,
        companyName: user.company?.name || 'Keel Platform',
        rank: user.rank,
        status: user.status,
        avatar: user.avatar_url,
        cocNumber: user.coc_number,
        seamanBookNumber: user.seaman_book_number,
        mfaEnabled: user.mfa_enabled
      },
    });

  } catch (error) {
    console.error("❌ AUTH LOGIN ERROR:", error);
    return res.status(500).json({ message: "System error during login." });
  }
};

// --- GET ME (Current User Context) ---
export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'role' },
        { model: Company, as: 'company' }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // We need the password_hash here too
    const user = await User.findByPk(userId, { attributes: ['id', 'password_hash'] });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password_hash = newHash;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
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