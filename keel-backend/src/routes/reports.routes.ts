//keel-backend/src/routes/reports.routes.ts

import { Router } from 'express';
import { generateFleetPDF, generateFleetExcel } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// BASE PATH: /api/reports

// 1. Download PDF (Admin/Manager/Master)
router.get(
  '/fleet/pdf', 
  authenticate, 
  checkRole(['ADMIN', 'MANAGER', 'MASTER']), 
  generateFleetPDF
);

// 2. Download Excel (Admin/Manager Only)
router.get(
  '/fleet/excel', 
  authenticate, 
  checkRole(['ADMIN', 'MANAGER']), 
  generateFleetExcel
);

export default router;