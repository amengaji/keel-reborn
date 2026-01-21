//keel-backend/src/routes/analytics.routes.ts

import { Router } from 'express';
import { getPlatformStats, getHighUtilizationTenants } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// Base Path: /api/analytics

// 1. Platform Overview (The "God Mode" Stats)
router.get(
  '/platform', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), // STRICTLY LOCKED to Owner
  getPlatformStats
);

// 2. High Utilization Report (Who needs an upsell?)
router.get(
  '/utilization', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), 
  getHighUtilizationTenants
);

export default router;