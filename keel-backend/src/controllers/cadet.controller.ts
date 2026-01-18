// keel-backend/src/controllers/cadet.controller.ts

import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import Task from '../models/Task';
import Assignment from '../models/Assignment';
import TraineeAssignment from '../models/TraineeAssignment'; 
import bcrypt from 'bcryptjs';

/**
 * GET ALL CADETS
 * Optimized to fetch:
 * 1. Active Vessel Name
 * 2. Sign-on Date for Sea Time calculation
 * 3. Count of total available tasks
 * 4. Count of completed (signed-off) tasks
 */
export const getCadets = async (req: Request, res: Response) => {
  try {
    const totalTasksCount = await Task.count();

    const cadets = await User.findAll({
      include: [
        { model: Role, as: 'role', where: { name: 'CADET' } },
        {
          model: TraineeAssignment,
          as: 'assignments',
          where: { status: 'ACTIVE' },
          required: false,
          include: [{ model: Vessel, attributes: ['name'] }]
        },
        {
          model: Assignment, 
          as: 'taskAssignments', // MUST MATCH THE ALIAS IN setupAssociations
          required: false,
        }
      ],
      attributes: { exclude: ['password_hash'] },
      order: [['first_name', 'ASC']]
    });

    const formattedCadets = cadets.map((c: any) => {
      const plainCadet = c.get({ plain: true });
      const activeAssignment = plainCadet.assignments?.[0];
      
      // Calculate real progress based on the count of rows in the Assignment table
      const completedTasksCount = plainCadet.taskAssignments ? plainCadet.taskAssignments.length : 0;

      return {
        ...plainCadet,
        name: `${plainCadet.first_name || ''} ${plainCadet.last_name || ''}`.trim(),
        vessel: activeAssignment?.Vessel ? activeAssignment.Vessel.name : null,
        sign_on_date: activeAssignment?.sign_on_date || null,
        completed_tasks_count: completedTasksCount,
        total_tasks_count: totalTasksCount,
        progress: totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0
      };
    });
    
    res.json(formattedCadets);
  } catch (error: any) {
    console.error("FETCH CADETS ERROR:", error);
    res.status(500).json({ message: 'Error fetching cadets', error: error.message });
  }
};

/**
 * CREATE CADET
 * Remains unchanged to ensure functionality parity.
 */
export const createCadet = async (req: Request, res: Response) => {
  try {
    const { fullName, first_name, last_name, email, password, indos, rank, nationality, phone } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

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
    if (!cadetRole) return res.status(500).json({ message: "System Error: CADET role missing" });

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

    return res.status(201).json({ message: "Cadet profile created successfully", cadet: newUser });
  } catch (error: any) {
    console.error("CREATE CADET ERROR:", error);
    return res.status(500).json({ message: "Error creating cadet", error: error.message });
  }
};

/**
 * DELETE CADET
 * FIXED: Performs cleanup of assignments before deleting user.
 */
export const deleteCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await TraineeAssignment.destroy({ where: { trainee_id: id } });
    const deletedCount = await User.destroy({ where: { id } });

    if (deletedCount === 0) return res.status(404).json({ message: 'Trainee not found in database' });

    res.json({ message: 'Trainee and all associated records removed successfully' });
  } catch (error: any) {
    console.error("DELETE CADET ERROR:", error);
    res.status(500).json({ message: 'Error removing cadet', error: error.message });
  }
};