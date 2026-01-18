// keel-backend/src/controllers/cadet.controller.ts

import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import bcrypt from 'bcryptjs';

/**
 * GET ALL CADETS
 * PURPOSE: Fetches all users with the 'CADET' role.
 * FIXED: Sends raw database attributes so the Assignments Page and Cadets Page 
 * both receive the same predictable data structure.
 */
export const getCadets = async (req: Request, res: Response) => {
  try {
    const cadets = await User.findAll({
      include: [
        { 
          model: Role, 
          as: 'role', 
          where: { name: 'CADET' } 
        },
        {
          model: Vessel,
          as: 'vessel',
          attributes: ['id', 'name'] 
        }
      ],
      attributes: { exclude: ['password_hash'] }, // Safety: Never send hashes
      order: [['first_name', 'ASC']]
    });
    
    // We send the raw array. The frontend services handle specific formatting.
    res.json(cadets);
  } catch (error: any) {
    console.error("FETCH CADETS ERROR:", error);
    res.status(500).json({ message: 'Error fetching cadets', error: error.message });
  }
};

/**
 * CREATE CADET
 * PURPOSE: Adds a new trainee to the system.
 * Handles both 'fullName' (from imports) or 'first_name/last_name' (from forms).
 */
export const createCadet = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      first_name,
      last_name,
      email,
      password,
      indos,
      rank,
      nationality,
      phone,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // RESOLVE NAMES: Ensure we have a first and last name for the DB
    let resolvedFirstName: string;
    let resolvedLastName: string;

    if (first_name && last_name) {
      resolvedFirstName = first_name.trim();
      resolvedLastName = last_name.trim();
    } else if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      resolvedFirstName = parts[0];
      resolvedLastName = parts.length > 1 ? parts.slice(1).join(" ") : "Trainee";
    } else {
      return res.status(400).json({ message: "Name is required" });
    }

    const cadetRole = await Role.findOne({ where: { name: "CADET" } });
    if (!cadetRole) {
      return res.status(500).json({ message: "System Error: CADET role missing" });
    }

    const passwordHash = await bcrypt.hash(password || "cadet123", 10);

    const newUser = await User.create({
      first_name: resolvedFirstName,
      last_name: resolvedLastName,
      email,
      password_hash: passwordHash,
      role_id: cadetRole.id,
      indos_number: indos || null,
      rank: rank || "Deck Cadet",
      nationality: nationality || null,
      phone: phone || null,
      status: "Ready",
    });

    return res.status(201).json({
      message: "Cadet profile created successfully",
      cadet: newUser
    });
  } catch (error: any) {
    console.error("CREATE CADET ERROR:", error);
    return res.status(500).json({ message: "Error creating cadet", error: error.message });
  }
};

/**
 * DELETE CADET
 */
export const deleteCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.json({ message: 'Cadet removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing cadet', error: error.message });
  }
};