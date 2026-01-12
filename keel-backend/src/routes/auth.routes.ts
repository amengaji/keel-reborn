// keel-reborn/keel-backend/src/routes/auth.routes.ts

import { Router } from 'express';
import { login } from '../controllers/auth.controller';

/**
 * MARITIME EXPERT NOTE:
 * Routes act as the communication channels between the Shore Bridge (Web)
 * and the Engine Room (Backend). This channel handles all security-related 
 * transmissions.
 */

const router = Router();

// URL Path: /api/auth/login
router.post('/login', login);

export default router;