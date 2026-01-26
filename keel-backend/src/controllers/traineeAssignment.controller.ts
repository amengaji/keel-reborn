//keel-backend/src/controllers/traineeAssignment.controller.ts

import { Request, Response } from 'express';
import TraineeAssignment from '../models/TraineeAssignment';
import User from '../models/User';
import Vessel from '../models/Vessel';

// --- GET ALL ASSIGNMENTS (For Company) ---
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    
    // Fetch only ACTIVE assignments
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

// --- ASSIGN CADET TO VESSEL (By Admin) ---
export const assignTrainee = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const { trainee_id, vessel_id, sign_on_date } = req.body;

    // 1. Validation
    const existing = await TraineeAssignment.findOne({
      where: { trainee_id, status: 'ACTIVE' }
    });

    if (existing) {
      return res.status(400).json({ message: 'Trainee is already assigned to a vessel.' });
    }

    // 2. Create Assignment (Status: ACTIVE, but Trainee hasn't "Joined" on mobile yet)
    const assignment = await TraineeAssignment.create({
      trainee_id,
      vessel_id,
      company_id: companyId,
      sign_on_date: sign_on_date || new Date(), // This is the "Planned" date
      status: 'ACTIVE'
    });

    // 3. Update User Link but NOT Status (Keep them 'Ready' until they confirm joining)
    // We update vessel_id so they can see it in the app
    await User.update(
      { vessel_id, status: 'Ready' }, // Keep status Ready so they can see "Join Vessel" button
      { where: { id: trainee_id } }
    );

    res.status(201).json(assignment);

  } catch (error) {
    console.error('Assign Error:', error);
    res.status(500).json({ message: 'Failed to assign trainee.' });
  }
};

// --- TRAINEE JOINS VESSEL (Confirm Date & Port) ---
export const confirmJoining = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const traineeId = req.user.id;
    const { sign_on_date, sign_on_port } = req.body;

    // 1. Find the pending assignment
    const assignment = await TraineeAssignment.findOne({
      where: { trainee_id: traineeId, status: 'ACTIVE' }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found.' });
    }

    // 2. Update Assignment Details
    await assignment.update({
      sign_on_date: sign_on_date || new Date(),
      sign_on_port: sign_on_port
    });

    // 3. FINALLY Update User Status to Onboard
    await User.update(
      { status: 'Onboard' },
      { where: { id: traineeId } }
    );

    res.json({ message: 'Welcome aboard! Status updated to Onboard.', assignment });

  } catch (error) {
    console.error('Confirm Join Error:', error);
    res.status(500).json({ message: 'Failed to confirm joining.' });
  }
};

// --- SIGN OFF (UNASSIGN) ---
export const signOffTrainee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // trainee_id
    const { sign_off_date } = req.body;

    const assignment = await TraineeAssignment.findOne({
      where: { trainee_id: id, status: 'ACTIVE' }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No active assignment found.' });
    }

    await assignment.update({
      sign_off_date: sign_off_date || new Date(),
      status: 'COMPLETED'
    });

    // Remove vessel_id from user and set status to Ready
    await User.update(
      { status: 'Ready', vessel_id: null }, 
      { where: { id } }
    );

    res.json({ message: 'Trainee signed off successfully.' });

  } catch (error) {
    console.error('Sign Off Error:', error);
    res.status(500).json({ message: 'Failed to sign off trainee.' });
  }
};