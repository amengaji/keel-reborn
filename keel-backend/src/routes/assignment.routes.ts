//keel-backend/src/routes/assignment.routes.ts

import { Router } from 'express';
import * as AssignmentController from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware'; 

const router = Router();

/**
 * ============================================================================
 * TRB ASSIGNMENT ROUTES
 * Manages the specific instances of tasks assigned to cadets.
 * ============================================================================
 */

// 1. Initialize TRB (Bulk Assign) - Triggered by Admin or Auto-hook
router.post('/initialize', authenticate, AssignmentController.initializeTRB);

// 2. MOBILE SYNC: Receive "Pending Review" status from App
// ✅ This was missing. It allows the Cadet to submit a task.
router.post('/sync-status', authenticate, AssignmentController.syncMobileStatus);

// 3. CTO: Get Pending Approvals & Sign Off
// Only CTOs and Masters should access these
router.get(
    '/cto/pending', 
    authenticate, 
    checkRole(['CTO', 'MASTER', 'SUPER_ADMIN']), 
    AssignmentController.getPendingCTOApprovals
);

router.put(
    '/:assignmentId/cto-sign', 
    authenticate, 
    checkRole(['CTO', 'MASTER', 'SUPER_ADMIN']), 
    AssignmentController.ctoSignOff
);

// 4. MASTER: Get Pending Approvals
// Returns tasks verified by CTO but pending Master's signature
router.get(
    '/master/pending', 
    authenticate, 
    checkRole(['MASTER', 'SUPER_ADMIN']), 
    AssignmentController.getPendingMasterApprovals
);

// 5. MASTER: Sign Off / Approve a specific task assignment
// Final step in the chain
router.put(
    '/:assignmentId/sign-off', 
    authenticate, 
    checkRole(['MASTER', 'SUPER_ADMIN']), 
    AssignmentController.masterSignOff
);

// 6. Get a specific cadet's progress (Placeholder for future drill-down)
router.get('/user/:userId', authenticate, async (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;