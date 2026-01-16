//keel-mobile/src/utils/watchAggregation.ts

import { calculateWatchDurationMinutes } from "./watchHours";

/**
 * =========================================================
 * INTERNAL LOG TYPES (UTILITY-SAFE)
 * ---------------------------------------------------------
 * IMPORTANT:
 * - DailyScreen includes PORT logs now
 * - These utilities MUST accept PORT, even if some
 *   aggregations only count BRIDGE/ENGINE.
 * =========================================================
 */
type WatchLogType = "DAILY" | "BRIDGE" | "ENGINE" | "PORT";

export type DailyWatchTotal = {
  dateKey: string; // YYYY-MM-DD
  bridgeMinutes: number;
  engineMinutes: number;
  totalMinutes: number;
};

/**
 * Minimal shape required by aggregation utilities.
 * Matches the cross-screen structure (DailyScreen logs).
 */
type WatchLogLike = {
  date: Date;
  type: WatchLogType;
  startTime?: Date;
  endTime?: Date;
};


/**
 * Groups watch logs by date and calculates daily totals.
 * Only BRIDGE and ENGINE logs are counted.
 */
export function calculateDailyWatchTotals(
  logs: WatchLogLike[]
): DailyWatchTotal[] {
  const map = new Map<string, DailyWatchTotal>();

  for (const log of logs) {
    if (log.type === "DAILY") continue;
    if (!log.startTime || !log.endTime) continue;

    // Normalize date to YYYY-MM-DD
    const d = new Date(log.date);
    const dateKey = d.toISOString().slice(0, 10);

    const minutes = calculateWatchDurationMinutes(
      log.startTime,
      log.endTime
    );

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        dateKey,
        bridgeMinutes: 0,
        engineMinutes: 0,
        totalMinutes: 0,
      });
    }

    const bucket = map.get(dateKey)!;

    if (log.type === "BRIDGE") {
      bucket.bridgeMinutes += minutes;
    }

    if (log.type === "ENGINE") {
      bucket.engineMinutes += minutes;
    }

    bucket.totalMinutes =
      bucket.bridgeMinutes + bucket.engineMinutes;
  }

  // Return sorted by date (newest first)
  return Array.from(map.values()).sort((a, b) =>
    a.dateKey < b.dateKey ? 1 : -1
  );
}
