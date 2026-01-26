//keel-backend/src/routes/traineeAssignment.routes.ts

import { Router } from 'express';
import { 
  getAssignments, 
  assignTrainee, 
  signOffTrainee,
  confirmJoining // <--- IMPORT
} from '../controllers/traineeAssignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// BASE PATH: /api/trainee-assignments

// 1. Get All Active Assignments (For the Company)
router.get('/', authenticate, getAssignments);

// 2. Assign Trainee to Vessel (Admin/Manager)
router.post('/', authenticate, checkRole(['ADMIN', 'MANAGER']), assignTrainee);

// 3. Trainee Confirms Joining (Self)
router.post('/join', authenticate, confirmJoining); // <--- NEW ROUTE

// 4. Sign Off Trainee (Admin/Manager)
router.put('/:id/sign-off', authenticate, checkRole(['ADMIN', 'MANAGER']), signOffTrainee);

export default router;