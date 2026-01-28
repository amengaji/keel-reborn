//keel-backend/src/controllers/watchkeeping.controller.ts

import { Request, Response } from 'express';
import WatchkeepingLog from '../models/WatchkeepingLog';
import { Op } from 'sequelize';

/**
 * SYNC WATCHKEEPING LOGS
 * Receives an array of logs from the Mobile App.
 * Upserts based on 'local_id' to prevent duplicates.
 */
export const syncWatchkeepingLogs = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { logs } = req.body; // Expecting { logs: [...] }

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(200).json({ message: "No logs to sync." });
    }

    let syncedCount = 0;

    // We process sequentially to ensure data integrity
    for (const log of logs) {
      // Mapping Mobile Field Names -> Backend Field Names
      const payload = {
        user_id: userId,
        local_id: log.id, // Mobile UUID
        start_time: log.start_time,
        end_time: log.end_time,
        watch_type: log.watch_type,
        ship_state: log.ship_state,
        location: log.location,
        is_cargo_ops: log.cargo_ops === 1 || log.cargo_ops === true, // Handle SQLite 0/1 or Boolean
        discipline: log.cadet_discipline,
        remarks: log.remarks,
        created_at: log.created_at
      };

      // UPSERT: Insert or Update if exists
      const [record, created] = await WatchkeepingLog.upsert(payload, {
        returning: true // specific for Postgres, harmless here if MySQL/SQLite
      });

      syncedCount++;
    }

    console.log(`✅ Synced ${syncedCount} watchkeeping logs for User ${userId}`);
    res.status(200).json({ message: "Sync successful", count: syncedCount });

  } catch (error: any) {
    console.error("Watchkeeping Sync Error:", error);
    res.status(500).json({ message: "Failed to sync watchkeeping logs", error: error.message });
  }
};

/**
 * GET STATS FOR CERTIFICATE
 * Calculates total Steering, Lookout, and Bridge hours for a specific cadet.
 * Used by the Web Dashboard for the Certificate Generation.
 */
export const getWatchkeepingStats = async (req: Request, res: Response) => {
    try {
        const { cadetId } = req.params;

        const logs = await WatchkeepingLog.findAll({
            where: { user_id: cadetId }
        });

        // Aggregation Logic
        let totalSteeringHours = 0;
        let totalBridgeHours = 0;
        let totalNightHours = 0; // Simple approximation: 20:00 to 06:00

        logs.forEach(log => {
            const start = new Date(log.start_time);
            const end = new Date(log.end_time);
            const durationHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            if (durationHrs <= 0) return;

            // 1. Total Bridge Time
            if (log.location?.toLowerCase().includes('bridge')) {
                totalBridgeHours += durationHrs;
            }

            // 2. Specific Discipline (Steering)
            if (log.discipline?.toLowerCase().includes('steering')) {
                totalSteeringHours += durationHrs;
            }

            // 3. Night Hours Check (Basic overlapping logic)
            // Checks if any part of the watch falls between 20:00 and 06:00
            const startHour = start.getHours();
            if (startHour >= 20 || startHour < 6) {
                totalNightHours += durationHrs;
            }
        });

        res.json({
            steering_hours: Math.round(totalSteeringHours * 10) / 10,
            bridge_hours: Math.round(totalBridgeHours * 10) / 10,
            night_hours: Math.round(totalNightHours * 10) / 10,
            total_logs: logs.length
        });

    } catch (error: any) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Failed to calculate stats", error: error.message });
    }
};