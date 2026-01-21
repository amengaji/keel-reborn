//keel-backend/src/routes/import.routes.ts

import { Router } from 'express';
import { importCadets, importVessels } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import uploadFile from '../middleware/upload.middleware';

const router = Router();

// BASE PATH: /api/import

// 1. Import Cadets (Admin/Manager Only)
// uploadFile.single('file') looks for a form-data field named 'file'
router.post(
  '/cadets', 
  authenticate, 
  checkRole(['ADMIN', 'MANAGER']), 
  uploadFile.single('file'), 
  importCadets
);

// 2. Import Vessels (Admin/Manager Only)
router.post(
  '/vessels', 
  authenticate, 
  checkRole(['ADMIN', 'MANAGER']), 
  uploadFile.single('file'), 
  importVessels
);

export default router;
