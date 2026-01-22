//keel-backend/src/routes/assignment.routes.ts

import { Router } from 'express';
import * as AssignmentController from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware'; // Assuming you have this, if not, we rely on check inside controller or just auth

const router = Router();

/**
 * ============================================================================
 * TRB ASSIGNMENT ROUTES
 * Manages the specific instances of tasks assigned to cadets.
 * ============================================================================
 */

// 1. Initialize TRB (Bulk Assign) - Usually triggered by Admin or Auto-hook
router.post('/initialize', authenticate, AssignmentController.initializeTRB);

router.get('/cto/pending', authenticate, checkRole(['CTO', 'MASTER']), AssignmentController.getPendingCTOApprovals);
router.put('/:assignmentId/cto-sign', authenticate, checkRole(['CTO', 'MASTER']), AssignmentController.ctoSignOff);

// 2. MASTER: Get Pending Approvals
// Returns tasks where cadet has finished, but Master hasn't signed yet.
router.get('/master/pending', authenticate, AssignmentController.getPendingMasterApprovals);

// 3. MASTER: Sign Off / Approve a specific task assignment
// We use PUT because we are updating an existing assignment record
router.put('/:assignmentId/sign-off', authenticate, AssignmentController.masterSignOff);


// 4. Get a specific cadet's progress (Placeholder for future drill-down)
router.get('/user/:userId', authenticate, async (req, res) => {
  // TODO: Implement getAssignmentsForUser in controller if needed later
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;