// keel-backend/src/controllers/cadet.controller.ts

import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import TraineeAssignment from '../models/TraineeAssignment'; // Added this to handle cleanup
import bcrypt from 'bcryptjs';

/**
 * GET ALL CADETS
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
      attributes: { exclude: ['password_hash'] },
      order: [['first_name', 'ASC']]
    });
    
    res.json(cadets);
  } catch (error: any) {
    console.error("FETCH CADETS ERROR:", error);
    res.status(500).json({ message: 'Error fetching cadets', error: error.message });
  }
};

/**
 * CREATE CADET
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
 * FIXED: Now performs a cascade delete to remove linked assignments first.
 * This prevents the "Foreign Key Constraint" error.
 */
export const deleteCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. First, delete any assignments linked to this trainee
    // This clears the way so the user can be deleted without errors
    await TraineeAssignment.destroy({
      where: { trainee_id: id }
    });

    // 2. Now delete the trainee profile itself
    const deletedCount = await User.destroy({ 
      where: { id } 
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Trainee not found in database' });
    }

    res.json({ message: 'Trainee and all associated records removed successfully' });
  } catch (error: any) {
    console.error("DELETE CADET ERROR:", error);
    res.status(500).json({ message: 'Error removing cadet', error: error.message });
  }
};