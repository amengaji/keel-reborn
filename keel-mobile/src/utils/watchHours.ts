//keel-mobile/src/utils/watchHours.ts

/**
 * STCW Watch Hour Utilities
 *
 * All calculations are done in MINUTES to avoid rounding errors.
 * UI layers should convert minutes → hours only for display.
 */

/**
 * Calculates duration between two Date objects in minutes.
 * Handles midnight crossover automatically.
 *
 * @param startTime Date object representing watch start
 * @param endTime Date object representing watch end
 * @returns number of minutes worked (integer)
 */
export function calculateWatchDurationMinutes(
  startTime: Date,
  endTime: Date
): number {
  if (!startTime || !endTime) {
    return 0;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  let diffMs = end.getTime() - start.getTime();

  // If end time is before start time, assume midnight crossover
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes > 0 ? diffMinutes : 0;
}

/**
 * Converts minutes to hours with 2 decimal precision
 * (used only for display purposes)
 */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
