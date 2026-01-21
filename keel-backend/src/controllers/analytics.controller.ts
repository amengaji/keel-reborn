//keel-backend/src/controllers/analytics.controller.ts

import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize'; 
import sequelize from '../config/database';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Role from '../models/Role'; 

/**
 * ============================================================
 * GET GLOBAL PLATFORM STATS (SUPER ADMIN)
 * ============================================================
 * Provides a "God Mode" view of the entire SaaS platform.
 */
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    // 1. Company Metrics
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { is_active: true } });

    // 2. User/License Metrics
    const totalUsers = await User.count();
    
    // Check if Role 'CADET' exists to avoid errors if DB is empty
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    const totalCadets = cadetRole 
      ? await User.count({ where: { role_id: cadetRole.id } }) 
      : 0;

    // 3. Financial/Subscription Health
    const subscriptions = await Subscription.findAll({
      where: { status: 'ACTIVE' }
    });

    let totalProjectedRevenue = 0;
    let totalSeatsSold = 0;
    
    subscriptions.forEach(sub => {
      // Calculate revenue based on seat limits
      totalProjectedRevenue += (Number(sub.price_per_cadet) * sub.cadet_limit);
      totalSeatsSold += sub.cadet_limit;
    });

    // 4. "Most Active" Leaderboard
    // FIXED: Changed 'COMPLETED' to 'Completed' to match Enum definition
    const activityLeaderboard = await sequelize.query(`
      SELECT c.name as company_name, COUNT(a.id) as tasks_completed
      FROM companies c
      JOIN users u ON u.company_id = c.id
      JOIN assignments a ON a.user_id = u.id
      WHERE a.status = 'Completed' 
      GROUP BY c.id, c.name
      ORDER BY tasks_completed DESC
      LIMIT 5
    `, { type: QueryTypes.SELECT }); 

    res.json({
      overview: {
        total_companies: totalCompanies,
        active_companies: activeCompanies,
        total_users: totalUsers,
        total_cadets: totalCadets,
      },
      financials: {
        projected_monthly_revenue: totalProjectedRevenue,
        total_seats_sold: totalSeatsSold,
        seat_utilization: totalSeatsSold > 0 ? Math.round((totalCadets / totalSeatsSold) * 100) : 0
      },
      leaderboard: activityLeaderboard
    });

  } catch (error) {
    console.error('❌ ANALYTICS ERROR:', error);
    res.status(500).json({ message: 'Failed to generate platform analytics.' });
  }
};

/**
 * ============================================================
 * GET COMPANY UTILIZATION (For Upselling)
 * ============================================================
 * Returns list of companies that used > 90% of their seats
 */
export const getHighUtilizationTenants = async (req: Request, res: Response) => {
  try {
    // Get all companies with their subscription and user count
    const companies = await Company.findAll({
      include: [
        { model: Subscription, as: 'subscription' },
        { model: User, as: 'employees' } 
      ]
    });

    const atRisk: any[] = [];

    for (const comp of companies) {
      if (!comp.subscription) continue;

      // Filter employees to find cadets
      // Note: We use the 'employees' property which we just added to the model
      const cadetCount = comp.employees?.filter((u: User) => u.rank === 'CADET' || u.role_id === 3).length || 0; 
      
      const limit = comp.subscription.cadet_limit;
      const usagePercent = limit > 0 ? (cadetCount / limit) * 100 : 0;

      if (usagePercent >= 80) { // Threshold for "Upsell Needed"
        atRisk.push({
          id: comp.id,
          name: comp.name,
          usage: `${cadetCount}/${limit}`,
          percent: Math.round(usagePercent),
          contact: comp.contact_email
        });
      }
    }

    res.json(atRisk);

  } catch (error) {
    console.error('❌ UTILIZATION ERROR:', error);
    res.status(500).json({ message: 'Failed to calculate utilization.' });
  }
};