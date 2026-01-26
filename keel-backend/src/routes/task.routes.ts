// keel-backend/src/routes/task.routes.ts

import { Router } from 'express';
import * as TaskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
// Add these to your router
import { uploadEvidence, getTaskEvidence } from '../controllers/task.controller';
import { upload } from '../middleware/upload.middleware'; // Ensure you have this or create simple multer setup



const router = Router();

// 1. GET TASKS
// Everyone (Cadets, Officers, Admins, Super Admins) can SEE the tasks available to them.
router.get('/', authenticate, TaskController.getTasks);

// 2. CREATE TASK
// Super Admins (Global) + Company Admins/Managers (Private) can create tasks.
router.post(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.createTask
);

// 3. UPDATE TASK
// Access allowed for Admins/Managers, but Controller enforces ownership strictness.
router.put(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.updateTask
);

// 4. DELETE SINGLE TASK
// Access allowed for Admins/Managers, but Controller enforces ownership strictness.
router.delete(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.deleteTask
);

// 5. BULK DELETE
// Dangerous operation: Only Super Admins or Company Admins (for their own data) should do this.
router.delete(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN']), 
  TaskController.deleteAllTasks
);

router.post('/evidence', authenticate, upload.single('file'), uploadEvidence);
router.get('/:taskId/evidence', authenticate, getTaskEvidence);

export default router;