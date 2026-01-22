//keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Role from "../models/Role";
import Company from "../models/Company";
import Vessel from "../models/Vessel"; // <--- ADDED IMPORT

/**
 * Authentication Controller
 * Handles Login for Emails (Admins/Master) AND IDs (CTOs: ctodeck.IMO)
 */

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
  // Use 'email' field from body, but treat it as a generic Login ID
  const rawId = req.body?.email; 
  const rawPassword = req.body?.password;
  
  const loginId = String(rawId || "").trim().toLowerCase(); 
  const password = String(rawPassword || "").trim();

  try {
    console.log(`🔐 Login Attempt: ${loginId}`);

    if (!loginId || !password) {
      return res.status(400).json({ message: "Login ID and password are required." });
    }

    // 1. Find User
    const user = await User.findOne({
      where: { email: loginId }, // Matches 'ctodeck.123' OR 'capt@gmail.com'
      include: [
        { model: Role, as: "role" },
        { model: Company, as: "company" },
        { model: Vessel, as: "vessel", attributes: ['id', 'name'] } // <--- FETCH VESSEL INFO
      ],
      attributes: [
        'id', 'email', 'password_hash', 'first_name', 'last_name', 
        'role_id', 'company_id', 'rank', 'status', 'avatar_url',
        'coc_number', 'seaman_book_number', 'mfa_enabled',
        'department', 
        'vessel_id' // <--- CRITICAL: Fetch Vessel ID
      ] 
    });

    if (!user) {
      console.log('❌ Login Failed: User not found.');
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: "Account setup incomplete." });
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
        company_id: user.company_id,
        department: user.department,
        vessel_id: user.vessel_id // <--- CRITICAL: Add to Token
      },
      process.env.JWT_SECRET || "maritime_secret_key",
      { expiresIn: "12h" }
    );

    console.log(`✅ Login Success: ${user.email} (${user.role?.name}) -> Vessel: ${user.vessel?.name || 'Shore'}`);

    // 4. Send Response
    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name,
        department: user.department,
        companyId: user.company_id,
        companyName: user.company?.name || 'Keel Platform',
        rank: user.rank,
        status: user.status,
        
        // --- VESSEL CONTEXT ---
        vesselId: user.vessel_id,     // <--- Send ID to frontend
        vesselName: user.vessel?.name,// <--- Send Name to frontend
        // ----------------------

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
        { model: Company, as: 'company' },
        { model: Vessel, as: 'vessel', attributes: ['id', 'name'] } // <--- FETCH VESSEL INFO
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return normalized object
    res.json({
        ...user.toJSON(),
        vesselId: user.vessel_id,     // <--- Ensure consistent property names
        vesselName: user.vessel?.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'password_hash'] });
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
        mfaEnabled: user.mfa_enabled,
        department: user.department,
        vessel_id: user.vessel_id
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
      status: 'Active',
      department: data.department, // Allow setting department on manual create
      vessel_id: data.vesselId // Allow setting vessel on manual create
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};