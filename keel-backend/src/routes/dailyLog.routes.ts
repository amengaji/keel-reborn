//keel-backend/src/routes/dailyLog.routes.ts

import { Router } from 'express';
import { getMonthlyLogs, saveLog } from '../controllers/dailyLog.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Base: /api/daily-logs

router.get('/', authenticate, getMonthlyLogs);
router.post('/', authenticate, saveLog);

export default router;