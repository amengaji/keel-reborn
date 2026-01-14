import { Router } from 'express';
import * as CadetController from '../controllers/cadet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware'; // <--- FIX: Import checkRole

const router = Router();

// Get all cadets (Protected)
router.get('/', authenticate, CadetController.getCadets);

// Create cadet (Admin/Manager only)
router.post('/', authenticate, checkRole(['ADMIN', 'MANAGER']), CadetController.createCadet);

// Delete cadet (Admin only)
router.delete('/:id', authenticate, checkRole(['ADMIN']), CadetController.deleteCadet);

export default router;