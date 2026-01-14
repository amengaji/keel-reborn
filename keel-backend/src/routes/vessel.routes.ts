import { Router } from 'express';
import * as VesselController from '../controllers/vessel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// Public Route (or Protected if you prefer)
router.get('/', authenticate, VesselController.getVessels);

// Protected Admin/Manager Routes
router.post('/', authenticate, checkRole(['ADMIN', 'MANAGER']), VesselController.createVessel);
router.put('/:id', authenticate, checkRole(['ADMIN', 'MANAGER']), VesselController.updateVessel);
router.delete('/:id', authenticate, checkRole(['ADMIN']), VesselController.deleteVessel);

export default router;