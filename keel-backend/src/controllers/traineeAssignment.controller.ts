//keel-backend/src/controllers/traineeAssignment.controller.ts

import { Request, Response } from 'express';
import TraineeAssignment from '../models/TraineeAssignment';
import User from '../models/User';
import Vessel from '../models/Vessel';
import { Op } from 'sequelize';

// --- GET ALL ASSIGNMENTS (For Company) ---
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    
    // Fetch only ACTIVE assignments (no sign_off_date)
    const assignments = await TraineeAssignment.findAll({
      where: { 
        company_id: companyId,
        status: 'ACTIVE'
      },
      include: [
        { model: User, as: 'trainee', attributes: ['id', 'first_name', 'last_name', 'rank'] },
        { model: Vessel, as: 'vessel', attributes: ['id', 'name', 'vessel_type'] }
      ]
    });

    res.json(assignments);
  } catch (error) {
    console.error('Fetch Assignments Error:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

// --- ASSIGN CADET TO VESSEL ---
export const assignTrainee = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const { trainee_id, vessel_id, sign_on_date } = req.body;

    // 1. Validation: Is cadet already onboard?
    const existing = await TraineeAssignment.findOne({
      where: {
        trainee_id,
        status: 'ACTIVE'
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Trainee is already assigned to a vessel. Sign them off first.' });
    }

    // 2. Create Assignment
    const assignment = await TraineeAssignment.create({
      trainee_id,
      vessel_id,
      company_id: companyId,
      sign_on_date: sign_on_date || new Date(),
      status: 'ACTIVE'
    });

    // 3. Update Cadet Status
    await User.update({ status: 'Onboard' }, { where: { id: trainee_id } });

    res.status(201).json(assignment);

  } catch (error) {
    console.error('Assign Error:', error);
    res.status(500).json({ message: 'Failed to assign trainee.' });
  }
};

// --- SIGN OFF (UNASSIGN) ---
export const signOffTrainee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // trainee_id
    const { sign_off_date } = req.body;

    // 1. Find the active assignment
    const assignment = await TraineeAssignment.findOne({
      where: {
        trainee_id: id,
        status: 'ACTIVE'
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found for this trainee.' });
    }

    // 2. Update Assignment (Close it)
    await assignment.update({
      sign_off_date: sign_off_date || new Date(),
      status: 'COMPLETED'
    });

    // 3. Update Cadet Status back to Ready
    await User.update({ status: 'Ready' }, { where: { id } });

    res.json({ message: 'Trainee signed off successfully.' });

  } catch (error) {
    console.error('Sign Off Error:', error);
    res.status(500).json({ message: 'Failed to sign off trainee.' });
  }
};