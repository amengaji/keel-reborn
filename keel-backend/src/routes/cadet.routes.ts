//keel-backend/src/routes/cadet.routes.ts

import { Router } from 'express';
import * as CadetController from '../controllers/cadet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { checkSeatAvailability } from '../middleware/subscription.middleware'; // <--- NEW IMPORT

const router = Router();

// Get all cadets (Protected)
router.get('/', authenticate, CadetController.getCadets);

// Create cadet (Admin/Manager only) + LICENSE CHECK
// We add 'checkSeatAvailability' here so it runs BEFORE the controller
router.post(
  '/', 
  authenticate, 
  checkRole(['ADMIN', 'MANAGER']), 
  checkSeatAvailability, // <--- THE GATEKEEPER
  CadetController.createCadet
);

// Update an existing cadet profile
router.put(
  '/:id', 
  authenticate, // Added security: Must be logged in to update
  checkRole(['ADMIN', 'MANAGER']), // Added security: Only admins can update
  CadetController.updateCadet
);

// Delete cadet (Admin only)
router.delete(
  '/:id', 
  authenticate, 
  checkRole(['ADMIN']), 
  CadetController.deleteCadet
);

export default router;