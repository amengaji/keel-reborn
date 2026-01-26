//keel-backend/src/routes/task.routes.ts

import { Router } from 'express';
import * as TaskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { uploadEvidence, getTaskEvidence, getMobileTasks } from '../controllers/task.controller';
import { upload } from '../middleware/upload.middleware'; 

const router = Router();

// 1. GET TASKS (Web Tree View)
router.get('/', authenticate, TaskController.getTasks);

// 2. MOBILE SYNC (Flat List) - ✅ NEW ROUTE
// Must be placed BEFORE /:id to prevent routing conflicts
router.get('/sync', authenticate, getMobileTasks);

// 3. EVIDENCE ENDPOINTS
router.post('/evidence', authenticate, upload.single('file'), uploadEvidence);
router.get('/:taskId/evidence', authenticate, getTaskEvidence);

// 4. CREATE TASK
router.post(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.createTask
);

// 5. UPDATE TASK
router.put(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.updateTask
);

// 6. DELETE SINGLE TASK
router.delete(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), 
  TaskController.deleteTask
);

// 7. BULK DELETE
router.delete(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN', 'ADMIN']), 
  TaskController.deleteAllTasks
);

export default router;