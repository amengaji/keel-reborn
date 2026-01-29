//keel-backend/src/routes/monthlyReview.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { getCadetReviews, createMonthlyReview } from '../controllers/monthlyReview.controller';

const router = Router();

/**
 * GET HISTORY
 * Accessible by the Cadet (to see feedback) and Officers
 */
router.get('/cadet/:userId', authenticate, getCadetReviews);

/**
 * SUBMIT REVIEW
 * Restricted to Master, CTO, or Admin
 */
router.post(
    '/submit', 
    authenticate, 
    checkRole(['MASTER', 'CTO', 'SUPER_ADMIN']), 
    createMonthlyReview
);

export default router;