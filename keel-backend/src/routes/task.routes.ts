import { Router } from 'express';
import * as TaskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// Everyone (Cadets, Officers, Admins) can SEE the tasks
router.get('/', authenticate, TaskController.getTasks);

// Only Admins can EDIT the Master Task List
router.post('/', authenticate, checkRole(['ADMIN']), TaskController.createTask);
router.put('/:id', authenticate, checkRole(['ADMIN']), TaskController.updateTask);
router.delete('/:id', authenticate, checkRole(['ADMIN']), TaskController.deleteTask);

export default router;