//keel-mobile/src/utils/stcwCompliance.ts

import { calculateWeeklyWatchTotals } from "./watchWeeklyAggregation";

/* =========================================================
   STCW COMPLIANCE ENGINE (LOGIC ONLY)
   ---------------------------------------------------------
   This file contains PURE calculation logic.
   - No UI
   - No database access
   - No side effects
   - Safe to unit-test
   ========================================================= */

type WatchLogLike = {
  date: Date;
  /**
   * DailyScreen now includes PORT logs.
   * Compliance logic must be able to accept PORT-shaped logs
   * even if specific checks later decide what counts as watchkeeping.
   */
  type: "DAILY" | "BRIDGE" | "ENGINE" | "PORT";
  startTime?: Date;
  endTime?: Date;
};


/**
 * Result of the 24-hour rest compliance check.
 */
export type Rest24hResult = {
  compliant: boolean;
  watchMinutes: number;
  restMinutes: number;
};

/**
 * Result of the 7-day rest compliance check.
 */
export type Rest7dResult = {
  compliant: boolean;
  watchMinutes: number;
  restMinutes: number;
};

/**
 * Combined STCW compliance result.
 */
export type StcwComplianceResult = {
  rest24h: Rest24hResult;
  rest7d: Rest7dResult;
};

/* =========================================================
   CONSTANTS (easy to read and change)
   ========================================================= */

const MINUTES_IN_24_HOURS = 24 * 60; // 1440
const MIN_REST_24_HOURS = 10 * 60;   // 600 minutes

const MINUTES_IN_7_DAYS = 7 * 24 * 60; // 10080
const MIN_REST_7_DAYS = 77 * 60;       // 4620 minutes

/* =========================================================
   24-HOUR REST CHECK
   ========================================================= */

/**
 * Checks STCW compliance for rest in any rolling 24-hour period.
 *
 * IMPORTANT:
 * - This function assumes watch logs are already correct.
 * - It uses TOTAL watch minutes for the selected date.
 * - More granular (hour-by-hour) checks can be added later.
 *
 * @param watchMinutes Total watch minutes in last 24 hours
 */
/**
 * Checks STCW compliance for rest in any rolling 24-hour period.
 *
 * IMPORTANT:
 * - This uses TRUE rolling 24-hour windows.
 * - Overnight and overlapping watches are handled correctly.
 *
 * @param logs All daily log entries
 */
export function check24HourRest(
  logs: WatchLogLike[]
): Rest24hResult {

  const watchMinutes =
    calculateMaxWatchMinutesIn24Hours(logs);

  const restMinutes =
    MINUTES_IN_24_HOURS - watchMinutes;

  return {
    compliant: restMinutes >= MIN_REST_24_HOURS,
    watchMinutes,
    restMinutes,
  };
}


/* =========================================================
   7-DAY REST CHECK (ROLLING WINDOW)
   ========================================================= */

/**
 * Checks STCW compliance for rest in any rolling 7-day period.
 *
 * This uses the WEEKLY watch aggregation you already built.
 *
 * @param logs All daily log entries
 * @param endDate Selected date (end of rolling 7-day window)
 */
export function check7DayRest(
  logs: WatchLogLike[],
  endDate: Date
): Rest7dResult {
  const weeklyTotals = calculateWeeklyWatchTotals(
    logs,
    endDate
  );

  const watchMinutes = weeklyTotals.totalMinutes;
  const restMinutes = MINUTES_IN_7_DAYS - watchMinutes;

  return {
    compliant: restMinutes >= MIN_REST_7_DAYS,
    watchMinutes,
    restMinutes,
  };
}

/* =========================================================
   COMBINED STCW COMPLIANCE CHECK
   ========================================================= */

/**
 * Performs a full STCW compliance check.
 *
 * @param logs All daily log entries
 * @param watchMinutes24h Total watch minutes in last 24 hours
 * @param endDate Selected date (used for rolling 7-day window)
 */
/**
 * Performs a full STCW compliance check.
 *
 * @param logs All daily log entries
 * @param endDate Selected date (used for rolling 7-day window)
 */
export function checkStcwCompliance(
  logs: WatchLogLike[],
  endDate: Date
): StcwComplianceResult {
  const rest24h = check24HourRest(logs as WatchLogLike[]);
  const rest7d = check7DayRest(logs, endDate);

  return {
    rest24h,
    rest7d,
  };
}


/* =========================================================
   TRUE ROLLING 24-HOUR WATCH CALCULATION
   ---------------------------------------------------------
   This computes the MAXIMUM watch minutes that occur
   within ANY rolling 24-hour window.

   This is the correct STCW interpretation.
   ========================================================= */

/**
 * Calculates the maximum watch minutes in any rolling 24-hour window.
 *
 * How it works (simple explanation):
 * 1. Convert each watch log into minute ranges.
 * 2. Slide a 24-hour window across time.
 * 3. Find the window with the highest watch minutes.
 *
 * @param logs All daily log entries
 */
export function calculateMaxWatchMinutesIn24Hours(
  logs: WatchLogLike[]
): number {


  // Collect all watch intervals (in milliseconds)
  const intervals: { start: number; end: number }[] = [];

  for (const log of logs) {
    if (log.type === "DAILY") continue;
    if (!log.startTime || !log.endTime) continue;

    let start = log.startTime.getTime();
    let end = log.endTime.getTime();

    // Handle overnight watches (end next day)
    if (end <= start) {
      end += 24 * 60 * 60 * 1000;
    }

    intervals.push({ start, end });
  }

  // No watch logs → zero watch time
  if (intervals.length === 0) return 0;

  // Sort intervals by start time
  intervals.sort((a, b) => a.start - b.start);

  const WINDOW_MS = 24 * 60 * 60 * 1000;
  let maxWatchMs = 0;

  // Slide window using each interval start as a window anchor
  for (const anchor of intervals) {
    const windowStart = anchor.start;
    const windowEnd = windowStart + WINDOW_MS;

    let watchMs = 0;

    for (const interval of intervals) {
      // Find overlap between interval and window
      const overlapStart = Math.max(interval.start, windowStart);
      const overlapEnd = Math.min(interval.end, windowEnd);

      if (overlapEnd > overlapStart) {
        watchMs += overlapEnd - overlapStart;
      }
    }

    if (watchMs > maxWatchMs) {
      maxWatchMs = watchMs;
    }
  }

  // Convert milliseconds → minutes
  return Math.floor(maxWatchMs / (60 * 1000));
}

