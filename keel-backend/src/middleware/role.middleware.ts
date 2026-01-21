//keel-backend/src/middleware/role.middleware.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // --- GOD MODE FIX ---
    // Always allow SUPER_ADMIN to pass, no matter what roles are required.
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Standard Check: Is user's role in the allowed list OR is user an ADMIN?
    // (We keep the OR ADMIN check for legacy compatibility)
    if (roles.includes(req.user.role) || req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
  };
};