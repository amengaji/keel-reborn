// keel-backend/src/controllers/traineeAssignment.controller.ts

import { Request, Response } from "express";
import TraineeAssignment from "../models/TraineeAssignment";
import User from "../models/User";
import Vessel from "../models/Vessel";

/**
 * GET all ACTIVE trainee-vessel assignments.
 * Includes nested Trainee (User) and Vessel details.
 */
export const getActiveTraineeAssignments = async (_req: Request, res: Response) => {
  try {
    const rows = await TraineeAssignment.findAll({
      where: { status: "ACTIVE" },
      include: [
        {
          model: User,
          as: "trainee",
          attributes: ["id", "first_name", "last_name", "rank", "status"],
        },
        {
          model: Vessel,
          attributes: ["id", "name", "vessel_type"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Helper: Map data to ensure no null trainees cause UI crashes
    const formattedRows = rows.map(row => {
      const data = row.toJSON();
      return {
        ...data,
        trainee: data.trainee || { first_name: "Unknown", last_name: "Trainee", rank: "N/A" }
      };
    });

    res.json(formattedRows);
  } catch (error) {
    console.error("GET ACTIVE TRAINEE ASSIGNMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch trainee assignments" });
  }
};

/**
 * ASSIGN trainee to vessel.
 * FIXED: Updates User status to 'Onboard' so they leave the Ready Pool.
 */
export const assignTraineeToVessel = async (req: Request, res: Response) => {
  try {
    const { trainee_id, vessel_id, sign_on_date } = req.body;

    if (!trainee_id || !vessel_id || !sign_on_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Create the assignment record in the TraineeAssignments table
    const assignment = await TraineeAssignment.create({
      trainee_id,
      vessel_id,
      sign_on_date,
      status: "ACTIVE",
    });

    // 2. Update the Trainee (User) status to 'Onboard'
    // This removes them from the 'Ready' list in the frontend filter.
    await User.update(
      { status: "Onboard" },
      { where: { id: trainee_id } }
    );

    res.status(201).json(assignment);
  } catch (error) {
    console.error("ASSIGN TRAINEE ERROR:", error);
    res.status(500).json({ message: "Failed to assign trainee" });
  }
};

/**
 * UNASSIGN trainee (sign-off).
 * FIXED: Updates User status back to 'Ready' so they reappear in the pool.
 */
export const unassignTrainee = async (req: Request, res: Response) => {
  try {
    const { traineeId } = req.params;

    // 1. Close the active assignment record
    await TraineeAssignment.update(
      {
        status: "COMPLETED",
        sign_off_date: new Date().toISOString().split('T')[0],
      },
      {
        where: {
          trainee_id: traineeId,
          status: "ACTIVE",
        },
      }
    );

    // 2. Return the trainee to the 'Ready' pool status
    await User.update(
      { status: "Ready" },
      { where: { id: traineeId } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("UNASSIGN TRAINEE ERROR:", error);
    res.status(500).json({ message: "Failed to unassign trainee" });
  }
};