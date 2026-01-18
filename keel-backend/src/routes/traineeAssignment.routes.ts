// keel-backend/src/routes/traineeAssignment.routes.ts
//
// PURPOSE:
// - API routes for trainee ↔ vessel assignment
//

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getActiveTraineeAssignments,
  assignTraineeToVessel,
  unassignTrainee,
} from "../controllers/traineeAssignment.controller";

const router = Router();

router.get("/", authenticate, getActiveTraineeAssignments);
router.post("/", authenticate, assignTraineeToVessel);
router.delete("/:traineeId", authenticate, unassignTrainee);

export default router;
