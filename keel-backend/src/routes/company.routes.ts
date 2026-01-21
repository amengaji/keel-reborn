//keel-backend/src/routes/company.routes.ts

import { Router } from 'express';
import { 
  getCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany 
} from '../controllers/company.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

// BASE PATH: /api/companies

// 1. Get All Companies (Super Admin Only)
router.get(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), 
  getCompanies
);

// 2. Create New Company (Super Admin Only)
router.post(
  '/', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), 
  createCompany
);

// 3. Update Company (Super Admin Only)
router.put(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), 
  updateCompany
);

// 4. Delete Company (Super Admin Only)
router.delete(
  '/:id', 
  authenticate, 
  checkRole(['SUPER_ADMIN']), 
  deleteCompany
);

export default router;