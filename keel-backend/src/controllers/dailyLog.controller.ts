//keel-backend/src/controllers/dailyLog.controller.ts

import { Request, Response } from 'express';
import DailyLog from '../models/DailyLog';
import { Op } from 'sequelize';

// --- GET LOGS (Monthly View) ---
export const getMonthlyLogs = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { month, year } = req.query; // e.g. ?month=01&year=2026

    if (!month || !year) {
        return res.status(400).json({ message: "Month and Year required" });
    }

    // Calculate start/end date for query
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`; // Loose upper bound works for DB

    const logs = await DailyLog.findAll({
        where: {
            user_id: userId,
            log_date: { [Op.between]: [startDate, endDate] }
        },
        order: [['log_date', 'ASC']]
    });

    res.json(logs);
  } catch (error) {
    console.error("Fetch Logs Error:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

// --- SAVE / UPDATE LOG ---
export const saveLog = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const vesselId = req.user.vessel_id;

    const { date, timeline, remarks, status } = req.body;

    if (!date || !timeline) {
        return res.status(400).json({ message: "Date and timeline data required" });
    }

    // Upsert (Update if exists, Insert if new)
    const [log, created] = await DailyLog.findOrCreate({
        where: { user_id: userId, log_date: date },
        defaults: {
            user_id: userId,
            vessel_id: vesselId, // Fallback if user has no vessel? Should handle that.
            log_date: date,
            timeline,
            remarks,
            status: status || 'DRAFT'
        }
    });

    if (!created) {
        await log.update({ timeline, remarks, status: status || log.status });
    }

    res.json({ message: "Log saved successfully", log });

  } catch (error) {
    console.error("Save Log Error:", error);
    res.status(500).json({ message: "Failed to save log" });
  }
};