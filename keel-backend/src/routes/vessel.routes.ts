//keel-backend/src/routes/vessel.routes.ts

import { Router } from 'express';
import { 
  getVessels, 
  getVesselById, // <--- Import this
  createVessel, 
  updateVessel, 
  deleteVessel 
} from '../controllers/vessel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// 1. List All Vessels
router.get('/', authenticate, getVessels);

// 2. Get Single Vessel Details (For Mobile "Vessel Info")
router.get('/:id', authenticate, getVesselById); // <--- New Route

// 3. Create Vessel (Admin/Manager only)
router.post('/', authenticate, checkRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN']), createVessel);

// 4. Update Vessel
router.put('/:id', authenticate, checkRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN']), updateVessel);

// 5. Delete Vessel
router.delete('/:id', authenticate, checkRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN']), deleteVessel);

export default router;