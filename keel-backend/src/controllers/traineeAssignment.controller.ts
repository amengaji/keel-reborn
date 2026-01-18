// keel-backend/src/controllers/traineeAssignment.controller.ts

import { Request, Response } from "express";
import TraineeAssignment from "../models/TraineeAssignment";
import User from "../models/User";
import Vessel from "../models/Vessel";

/**
 * GET all ACTIVE trainee-vessel assignments
 * FIXED: Ensures trainee first_name and last_name are explicitly included 
 * and properly structured for the frontend.
 */
export const getActiveTraineeAssignments = async (_req: Request, res: Response) => {
  try {
    const rows = await TraineeAssignment.findAll({
      where: { status: "ACTIVE" },
      include: [
        {
          model: User,
          as: "trainee", // This alias must match the association in associations.ts
          attributes: [
            "id",
            "first_name",
            "last_name",
            "rank",
            "status",
          ],
        },
        {
          model: Vessel,
          attributes: ["id", "name", "vessel_type"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Helper: Map the rows to ensure the trainee object is never null 
    // and keys are predictable for the frontend.
    const formattedRows = rows.map(row => {
      const data = row.toJSON();
      return {
        ...data,
        // Ensure trainee exists to prevent "Deck Cadet" fallback on UI
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
 * ASSIGN trainee to vessel
 */
export const assignTraineeToVessel = async (req: Request, res: Response) => {
  try {
    const { trainee_id, vessel_id, sign_on_date } = req.body;

    if (!trainee_id || !vessel_id || !sign_on_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignment = await TraineeAssignment.create({
      trainee_id,
      vessel_id,
      sign_on_date,
      status: "ACTIVE",
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error("ASSIGN TRAINEE ERROR:", error);
    res.status(500).json({ message: "Failed to assign trainee" });
  }
};

/**
 * UNASSIGN trainee (sign-off)
 */
export const unassignTrainee = async (req: Request, res: Response) => {
  try {
    const { traineeId } = req.params;

    // Set status to COMPLETED and set sign-off date
    await TraineeAssignment.update(
      {
        status: "COMPLETED",
        sign_off_date: new Date().toISOString().split('T')[0], // Standard YYYY-MM-DD
      },
      {
        where: {
          trainee_id: traineeId,
          status: "ACTIVE",
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("UNASSIGN TRAINEE ERROR:", error);
    res.status(500).json({ message: "Failed to unassign trainee" });
  }
};