//keel-mobile/src/db/dailyLogs.ts

import { getDatabase } from "./database";

/**
 * DailyLogDBInput
 * ---------------
 * Canonical TypeScript shape used by UI and DB layer.
 * camelCase ONLY in TypeScript.
 */
export type DailyLogDBInput = {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD or full ISO)

  /**
   * Log type:
   * DAILY   → Day work
   * BRIDGE  → Sea watch (bridge)
   * ENGINE  → Sea watch (engine)
   * PORT    → Port watch (cargo / anchor / gangway / bunkering)
   */
  type: "DAILY" | "BRIDGE" | "ENGINE" | "PORT";

  /**
   * Port Watch sub-type
   * Only applicable when type === "PORT"
   */
  portWatchType?: "CARGO" | "ANCHOR" | "GANGWAY" | "BUNKERING" | null;

  startTime?: string | null;
  endTime?: string | null;

  summary: string;
  remarks?: string | null;


  // Bridge navigation fields
  latDeg?: number | null;
  latMin?: number | null;
  latDir?: "N" | "S" | null;

  lonDeg?: number | null;
  lonMin?: number | null;
  lonDir?: "E" | "W" | null;

  // Bridge watchkeeping fields
  courseDeg?: number | null;
  speedKn?: number | null;
  weather?: string | null;
  steeringMinutes?: number | null;

  // Lookout flag (BOOLEAN in UI, INTEGER in DB)
  isLookout?: boolean | null;

  // Daily Work category payload (JSON string array)
  dailyWorkCategories?: string | null;

  // Engine watch payload (JSON string)
  machineryMonitored?: string | null;
};

/**
 * insertDailyLog
 * -------------
 * Inserts a new log entry.
 */
export function insertDailyLog(log: DailyLogDBInput): void {
  const db = getDatabase();

  db.runSync(
    `
    INSERT INTO daily_logs (
      id,
      date,
      type,
      port_watch_type,

      start_time,
      end_time,
      summary,
      remarks,
      created_at,

      lat_deg,
      lat_min,
      lat_dir,
      lon_deg,
      lon_min,
      lon_dir,

      course_deg,
      speed_kn,
      weather,
      steering_minutes,
      is_lookout,
      daily_work_categories,
      machinery_monitored
    )
    VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?
    )

    `,
    [
      log.id,
      log.date,
      log.type,
      log.portWatchType ?? null,

      log.startTime ?? null,
      log.endTime ?? null,
      log.summary,
      log.remarks ?? null,
      new Date().toISOString(),

      log.latDeg ?? null,
      log.latMin ?? null,
      log.latDir ?? null,
      log.lonDeg ?? null,
      log.lonMin ?? null,
      log.lonDir ?? null,

      log.courseDeg ?? null,
      log.speedKn ?? null,
      log.weather ?? null,
      log.steeringMinutes ?? null,
      log.isLookout != null ? (log.isLookout ? 1 : 0) : null,

      log.dailyWorkCategories ?? null, 
      log.machineryMonitored ?? null,
    ]
  );
}

/**
 * updateDailyLog
 * -------------
 * Updates an existing log entry.
 */
export function updateDailyLog(log: DailyLogDBInput): void {
  const db = getDatabase();

  db.runSync(
    `
    UPDATE daily_logs
    SET
      date = ?,
      type = ?,
      port_watch_type = ?,
      start_time = ?,
      end_time = ?,
      summary = ?,
      remarks = ?,

      lat_deg = ?,
      lat_min = ?,
      lat_dir = ?,
      lon_deg = ?,
      lon_min = ?,
      lon_dir = ?,

      course_deg = ?,
      speed_kn = ?,
      weather = ?,
      steering_minutes = ?,
      is_lookout = ?,

      daily_work_categories = ?,

      machinery_monitored = ?
    WHERE id = ?
    `,
    [
      log.date,
      log.type,
      log.portWatchType ?? null,
      log.startTime ?? null,
      log.endTime ?? null,
      log.summary,
      log.remarks ?? null,

      log.latDeg ?? null,
      log.latMin ?? null,
      log.latDir ?? null,
      log.lonDeg ?? null,
      log.lonMin ?? null,
      log.lonDir ?? null,

      log.courseDeg ?? null,
      log.speedKn ?? null,
      log.weather ?? null,
      log.steeringMinutes ?? null,
      log.isLookout != null ? (log.isLookout ? 1 : 0) : null,

      log.machineryMonitored ?? null,

      log.id,
    ]
  );
}

/**
 * deleteDailyLogById
 * -----------------
 */
export function deleteDailyLogById(id: string): void {
  const db = getDatabase();

  db.runSync(
    `
    DELETE FROM daily_logs
    WHERE id = ?
    `,
    [id]
  );
}

/**
 * getAllDailyLogs
 * --------------
 * Reads logs from DB and maps snake_case → camelCase via aliases.
 */
export function getAllDailyLogs(): DailyLogDBInput[] {
  const db = getDatabase();

  const result = db.getAllSync<DailyLogDBInput>(
    `
    SELECT
      id,
      date,
      type,
      port_watch_type AS portWatchType,
      start_time AS startTime,
      end_time AS endTime,
      summary,
      remarks,

      lat_deg AS latDeg,
      lat_min AS latMin,
      lat_dir AS latDir,
      lon_deg AS lonDeg,
      lon_min AS lonMin,
      lon_dir AS lonDir,

      course_deg AS courseDeg,
      speed_kn AS speedKn,
      weather,
      steering_minutes AS steeringMinutes,
      is_lookout AS isLookout,
      daily_work_categories AS dailyWorkCategories,
      machinery_monitored AS machineryMonitored
    FROM daily_logs
    ORDER BY date DESC, created_at DESC
    `
  );

  return result ?? [];
}
