//keel-backend/src/routes/watchkeeping.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    syncWatchkeepingLogs, 
    getWatchkeepingStats 
} from '../controllers/watchkeeping.controller';

const router = Router();

/**
 * MOBILE SYNC
 * Pushes local SQLite watch logs to the server.
 */
router.post('/sync', authenticate, syncWatchkeepingLogs);

/**
 * WEB DASHBOARD
 * Fetches aggregated stats (Steering/Bridge/Night hours) for the Certificate.
 */
router.get('/stats/:cadetId', authenticate, getWatchkeepingStats);

export default router;