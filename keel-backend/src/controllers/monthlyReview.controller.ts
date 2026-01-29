//keel-backend/src/controllers/monthlyReview.controller.ts

import { Request, Response } from 'express';
import MonthlyReview from '../models/MonthlyReview';
import Assignment from '../models/Assignment';
import WatchkeepingLog from '../models/WatchkeepingLog';
import User from '../models/User';
import { Op } from 'sequelize';

/**
 * GET REVIEWS FOR A SPECIFIC CADET
 */
export const getCadetReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reviews = await MonthlyReview.findAll({
      where: { user_id: userId },
      include: [
        { model: User, as: 'reviewer', attributes: ['first_name', 'last_name', 'rank'] }
      ],
      order: [['review_year', 'DESC'], ['review_month', 'DESC']]
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

/**
 * CREATE A NEW MONTHLY REVIEW
 * This automatically calculates stats for the month to create a "snapshot".
 */
export const createMonthlyReview = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - Reviewer is the logged-in Master/CTO
    const reviewerId = req.user.id;
    const { userId, vesselId, month, year, performanceScore, comments } = req.body;

    // 1. Calculate Tasks Completed this month
    const taskCount = await Assignment.count({
      where: {
        user_id: userId,
        status: 'Completed',
        updated_at: {
          [Op.between]: [new Date(year, month - 1, 1), new Date(year, month, 0)]
        }
      }
    });

    // 2. Calculate Watch Hours this month
    const watchLogs = await WatchkeepingLog.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.between]: [new Date(year, month - 1, 1), new Date(year, month, 0)]
        }
      }
    });

    let totalHours = 0;
    watchLogs.forEach(log => {
      const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60);
      if (duration > 0) totalHours += duration;
    });

    // 3. Create Review
    const review = await MonthlyReview.create({
      user_id: userId,
      reviewer_id: reviewerId,
      vessel_id: vesselId,
      review_month: month,
      review_year: year,
      tasks_completed: taskCount,
      sea_hours_this_month: Math.round(totalHours * 10) / 10,
      performance_score: performanceScore,
      comments,
      digital_signature: `SIGNED_BY_REV_${reviewerId}_AT_${Date.now()}` // Basic placeholder for now
    });

    res.status(201).json({ message: 'Monthly review submitted successfully', review });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'A review for this month already exists.' });
    }
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};