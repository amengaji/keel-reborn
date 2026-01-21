//keel-backend/src/middleware/subscription.middleware.ts

import { Request, Response, NextFunction } from 'express';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Role from '../models/Role';
import { Op } from 'sequelize';

// Extend Express Request to include user info (JWT payload usually puts this here)
interface AuthRequest extends Request {
  user?: {
    id: number;
    company_id: number;
    role: string;
  };
}

/**
 * ============================================================
 * GATEKEEPER 1: VALIDATE SUBSCRIPTION STATUS
 * ============================================================
 * Checks if:
 * 1. Company exists and is marked 'Active'
 * 2. Subscription is not expired (including Grace Period)
 * * Apply this to: All protected routes (except /auth/login)
 */
export const validateSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.company_id;

    // Super Admins bypass all checks (they own the platform)
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: No company association found.' });
    }

    // 1. Fetch Company & Subscription
    const company = await Company.findByPk(companyId, {
      include: [{ model: Subscription, as: 'subscription' }]
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    // 2. Check if Company is banned/inactive
    if (!company.is_active) {
      return res.status(403).json({ 
        message: 'Access Suspended: Your company account has been deactivated. Please contact support.' 
      });
    }

    // 3. Check License Expiry (Soft Block)
    const subscription = company.subscription;
    if (subscription) {
      const today = new Date();
      const validUntil = new Date(subscription.valid_until);
      
      // Calculate Grace Period End Date
      const gracePeriodEnd = new Date(validUntil);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + subscription.grace_period_days);

      // Logic: If Today > Grace Period End -> BLOCK
      if (today > gracePeriodEnd) {
        return res.status(402).json({ // 402 Payment Required
          message: 'License Expired: Your subscription (including grace period) has ended. Please renew to continue.',
          expiry_date: validUntil.toISOString().split('T')[0],
          grace_period_ended: gracePeriodEnd.toISOString().split('T')[0]
        });
      }
    }

    // All good, proceed
    next();

  } catch (error) {
    console.error('❌ SUBSCRIPTION CHECK FAILED:', error);
    return res.status(500).json({ message: 'Internal Server Error during license verification.' });
  }
};

/**
 * ============================================================
 * GATEKEEPER 2: CHECK SEAT AVAILABILITY
 * ============================================================
 * Checks if:
 * 1. Adding a new user would exceed the 'cadet_limit'
 * * Apply this to: POST /api/cadets (Creation Route)
 */
export const checkSeatAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.company_id;

    // Super Admins bypass limits
    if (req.user?.role === 'SUPER_ADMIN') return next();

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID missing.' });
    }

    // 1. Get Subscription Limit
    const subscription = await Subscription.findOne({ where: { company_id: companyId } });
    
    // If no subscription record exists, we assume 0 seats (Blocked)
    if (!subscription) {
      return res.status(403).json({ message: 'No active subscription found. Cannot add cadets.' });
    }

    const limit = subscription.cadet_limit;

    // 2. Count Current Cadets
    // We assume 'CADET' is the role name. We find the Role ID first to be safe.
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } }); // Adjust 'CADET' if your role is named 'TRAINEE'
    
    if (!cadetRole) {
        console.warn('⚠️ Role "CADET" not found in DB. Skipping limit check.');
        return next(); 
    }

    const currentCadetCount = await User.count({
      where: {
        company_id: companyId,
        role_id: cadetRole.id
      }
    });

    // 3. Compare
    if (currentCadetCount >= limit) {
      return res.status(403).json({ 
        message: `License Limit Reached: You have used ${currentCadetCount}/${limit} cadet seats. Upgrade your plan to add more.` 
      });
    }

    next();

  } catch (error) {
    console.error('❌ SEAT CHECK FAILED:', error);
    return res.status(500).json({ message: 'Internal Server Error during seat verification.' });
  }
};