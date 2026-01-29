// keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 
import User from "../models/User";
import Role from "../models/Role";
import Company from "../models/Company";
import Vessel from "../models/Vessel";
import TraineeAssignment from "../models/TraineeAssignment"; 

// --- HELPER: DEEP RESOLVE VESSEL ---
// Checks User table -> then TraineeAssignment table -> Self-Heals if needed
const resolveVesselInfo = async (user: User) => {
  
  // 1. Happy Path: User already has vessel loaded
  if (user.vessel && user.vessel.name) {
      return { id: user.vessel.id, name: user.vessel.name };
  }

  // 2. Fallback A: User has ID but no association loaded
  if (user.vessel_id) {
      const v = await Vessel.findByPk(user.vessel_id);
      if (v) return { id: v.id, name: v.name };
  }

  // 3. Fallback B: Check TraineeAssignment table (Primarily for Cadets)
  const activeAssignment = await TraineeAssignment.findOne({
      where: { 
          trainee_id: user.id,
          status: 'ACTIVE'
      },
      include: [{ model: Vessel, as: 'vessel' }]
  });

  if (activeAssignment && activeAssignment.vessel) {
      // SELF-HEAL: Update the user record
      console.log(`🛠️ Self-Healing User ${user.email}: Linking to Vessel ${activeAssignment.vessel.name}`);
      await User.update(
          { vessel_id: activeAssignment.vessel.id, status: 'Onboard' },
          { where: { id: user.id } }
      );
      
      return { 
          id: activeAssignment.vessel.id, 
          name: activeAssignment.vessel.name 
      };
  }

  return { id: null, name: null };
};

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
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
      where: { email: loginId },
      include: [
        { model: Role, as: "role" },
        { model: Company, as: "company" },
        { model: Vessel, as: "vessel", attributes: ["id", "name"] }
      ]
    });

    if (!user) {
      console.log("❌ Login Failed: User not found.");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: "Account setup incomplete." });
    }

    // 2. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log("❌ Login Failed: Password mismatch.");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 3. Deep Resolve Vessel (Self-Healing)
    const vesselInfo = await resolveVesselInfo(user);

    // 4. Generate Token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        company_id: user.company_id,
        department: user.department,
        vessel_id: vesselInfo.id // ✅ Use the resolved ID
      },
      process.env.JWT_SECRET || "maritime_secret_key",
      { expiresIn: "12h" }
    );

    console.log(`✅ Login Success: ${user.email} | Vessel: ${vesselInfo.name || 'None'}`);

    // 5. Send Response
    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name,
        department: user.department,
        companyId: user.company_id,
        companyName: user.company?.name || "Keel Platform",
        rank: user.rank,
        status: user.status,

        // --- VESSEL CONTEXT ---
        vesselId: vesselInfo.id,
        vesselName: vesselInfo.name, 
        
        avatar: user.avatar_url,
        cocNumber: user.coc_number,
        seamanBookNumber: user.seaman_book_number,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (error) {
    console.error("❌ AUTH LOGIN ERROR:", error);
    return res.status(500).json({ message: "System error during login." });
  }
};

// --- GET ME ---
export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password_hash"] },
      include: [
        { model: Role, as: "role" },
        { model: Company, as: "company" },
        { model: Vessel, as: "vessel", attributes: ["id", "name"] }
      ]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Deep Resolve
    const vesselInfo = await resolveVesselInfo(user);

    res.json({
      ...user.toJSON(),
      name: `${user.first_name} ${user.last_name}`,
      vesselId: vesselInfo.id,
      vesselName: vesselInfo.name
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId, { attributes: ["id", "password_hash"] });
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
  // @ts-ignore
  const userIdFromToken = req.user?.id;
  const { userId, cocNumber, seamanBookNumber, mfaEnabled, status } = req.body;

  const targetId = userId || userIdFromToken;

  try {
    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (cocNumber !== undefined) user.coc_number = cocNumber;
    if (seamanBookNumber !== undefined) user.seaman_book_number = seamanBookNumber;
    if (mfaEnabled !== undefined) user.mfa_enabled = mfaEnabled;
    if (status !== undefined) user.status = status;

    await user.save();

    // Re-fetch 
    const updatedUser = await User.findByPk(user.id, {
        include: [{ model: Vessel, as: "vessel", attributes: ["id", "name"] }]
    });

    const vesselInfo = await resolveVesselInfo(updatedUser!);

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: `${updatedUser!.first_name} ${updatedUser!.last_name}`,
        firstName: updatedUser!.first_name,
        lastName: updatedUser!.last_name,
        role: "CADET", 
        cocNumber: updatedUser!.coc_number,
        seamanBookNumber: updatedUser!.seaman_book_number,
        mfaEnabled: updatedUser!.mfa_enabled,
        department: updatedUser!.department,
        rank: updatedUser!.rank,
        status: updatedUser!.status, 
        vesselId: vesselInfo.id,
        vesselName: vesselInfo.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// --- CREATE USER ---
export const createUser = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // @ts-ignore
    const currentUser = req.user;

    let targetCompanyId = currentUser.company_id;
    if (currentUser.role === "SUPER_ADMIN" && data.companyId) {
      targetCompanyId = data.companyId;
    }

    const newUser = await User.create({
      email: data.email,
      password_hash: await bcrypt.hash(data.password || "Keel@123", 10),
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      company_id: targetCompanyId,
      status: "Active",
      department: data.department,
      vessel_id: data.vesselId
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};