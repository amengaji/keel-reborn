//keel-mobile/src/daily-logs/dailyLogsDomain.ts

/**
 * ============================================================
 * Daily Logs — Domain Contract
 * ============================================================
 *
 * PURPOSE:
 * - Define what a "Daily Log" officially means in KEEL
 * - Provide a stable contract for:
 *   - UI (DailyScreen)
 *   - Context (DailyLogsContext — next step)
 *   - Home dashboard (compliance indicators)
 *   - Backend sync (later)
 *
 * IMPORTANT:
 * - This file contains NO UI code
 * - This file contains NO database code
 * - This file contains NO business rules for watch hours
 *
 * It only defines:
 * - Structure
 * - Semantics
 * - Safe helper interpretations
 */

/* ============================================================
 * Core Daily Log Types
 * ============================================================ */

/**
 * Represents a single Daily Log entry.
 * This matches what the UI already captures,
 * without enforcing DB schema details.
 */
export interface DailyLogEntry {
  /** Unique identifier (local DB or backend later) */
  id: string;

  /** Calendar date the log refers to */
  date: Date;

  /**
   * Log category.
   * DAILY  → general daily narrative
   * BRIDGE → bridge / watch-related narrative
   * ENGINE → engine room narrative
   * PORT   → port watch narrative
   */
  type: "DAILY" | "BRIDGE" | "ENGINE" | "PORT";
  
  /** Port Watch sub-type (if applicable) */
  portWatchType?: "CARGO" | "ANCHOR" | "GANGWAY" | "BUNKERING" | null;

  /** Absolute start timestamp (if applicable) */
  startTime?: Date;

  /** Absolute end timestamp (if applicable) */
  endTime?: Date;

  /** Free-text summary entered by cadet */
  summary: string;

  /** Optional remarks */
  remarks?: string;

  /**
   * DAILY WORK — selected categories
   * Stored as JSON string in DB
   * Parsed to array in UI
   */
  dailyWorkCategories?: string | null;

  // --------------------------------------------------
  // BRIDGE / WATCHKEEPING FIELDS
  // --------------------------------------------------
  latDeg?: number | null;
  latMin?: number | null;
  latDir?: "N" | "S" | null;

  lonDeg?: number | null;
  lonMin?: number | null;
  lonDir?: "E" | "W" | null;

  courseDeg?: number | null;
  speedKn?: number | null;
  weather?: string | null;
  steeringMinutes?: number | null;
  isLookout?: boolean | null;

  // --------------------------------------------------
  // ENGINE WATCH
  // --------------------------------------------------
  machineryMonitored?: string | null;

  /** Creation timestamp (local) */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt?: Date;
}


/* ============================================================
 * Compliance-Oriented Status
 * ============================================================ */

/**
 * High-level Daily Logs compliance status.
 * Used by Home dashboard (read-only).
 */
export type DailyLogsStatus =
  | "NOT_STARTED"   // no logs at all
  | "IN_PROGRESS";  // at least one log exists

/**
 * NOTE:
 * There is intentionally NO "COMPLETED" status here.
 *
 * Daily Logs are continuous by nature.
 * Completion is assessed only over a time range
 * (future watchkeeping / sea service logic).
 */

/* ============================================================
 * Safe Helper Functions (Pure)
 * ============================================================ */

/**
 * Returns true if there is at least one Daily Log.
 * Used to answer: "Has the cadet started logging?"
 */
export function hasAnyDailyLogs(
  logs: DailyLogEntry[] | undefined | null
): boolean {
  return Array.isArray(logs) && logs.length > 0;
}

/**
 * Returns the most recent log date, if any.
 * Used for inspector visibility (recency).
 */
export function getLastDailyLogDate(
  logs: DailyLogEntry[] | undefined | null
): Date | null {
  if (!Array.isArray(logs) || logs.length === 0) {
    return null;
  }

  return logs
    .map((l) => l.date)
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

/**
 * Derives a conservative Daily Logs status.
 * This is intentionally simple and defensible.
 */
export function getDailyLogsStatus(
  logs: DailyLogEntry[] | undefined | null
): DailyLogsStatus {
  if (!hasAnyDailyLogs(logs)) {
    return "NOT_STARTED";
  }

  return "IN_PROGRESS";
}
