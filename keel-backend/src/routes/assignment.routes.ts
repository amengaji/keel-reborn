import { Router } from 'express';
import * as AssignmentController from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Initialize all tasks for a cadet
router.post('/initialize', authenticate, AssignmentController.initializeTRB);

// Get a specific cadet's progress
router.get('/user/:userId', authenticate, async (req, res) => {
  // We'll add a 'getAssignments' controller function next
});

export default router;