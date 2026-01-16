//keel-mobile/src/utils/watchWeeklyAggregation.ts

import { calculateDailyWatchTotals, DailyWatchTotal } from "./watchAggregation";

/* =========================================================
   WEEKLY WATCH AGGREGATION (ROLLING 7 DAYS)
   ---------------------------------------------------------
   This file contains PURE calculation logic.
   - No UI
   - No database access
   - No side effects
   ========================================================= */

/**
 * Result structure for weekly watch totals.
 * All values are in minutes.
 */
export type WeeklyWatchTotal = {
  startDateKey: string; // YYYY-MM-DD (6 days before end date)
  endDateKey: string;   // YYYY-MM-DD (selected date)
  bridgeMinutes: number;
  engineMinutes: number;
  totalMinutes: number;
};

/**
 * Calculates rolling 7-day watch totals ending on a given date.
 *
 * IMPORTANT:
 * - This is NOT a calendar week (Mon–Sun).
 * - This is a rolling window used by STCW regulations.
 *
 * @param logs All daily log entries (raw logs)
 * @param endDate The selected date (end of the 7-day window)
 */
export function calculateWeeklyWatchTotals(
  logs: {
    date: Date;
    type: "DAILY" | "BRIDGE" | "ENGINE" | "PORT";
    startTime?: Date;
    endTime?: Date;
  }[],
  endDate: Date
): WeeklyWatchTotal {
  // First, reuse the DAILY aggregation logic
  // This gives us per-day totals (Bridge / Engine / Total)
  const dailyTotals: DailyWatchTotal[] =
    calculateDailyWatchTotals(logs);

  // Normalize end date to YYYY-MM-DD
  const endDateKey = endDate.toISOString().slice(0, 10);

  // Calculate start date (6 days before end date)
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const startDateKey = startDate.toISOString().slice(0, 10);

  let bridgeMinutes = 0;
  let engineMinutes = 0;

  // Sum only the days that fall inside the rolling window
  for (const day of dailyTotals) {
    if (day.dateKey >= startDateKey && day.dateKey <= endDateKey) {
      bridgeMinutes += day.bridgeMinutes;
      engineMinutes += day.engineMinutes;
    }
  }

  return {
    startDateKey,
    endDateKey,
    bridgeMinutes,
    engineMinutes,
    totalMinutes: bridgeMinutes + engineMinutes,
  };
}
