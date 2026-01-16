//keel-mobile/src/db/watchkeeping.ts

/**
 * ============================================================
 * Watchkeeping — Local DB Adapter (SYNC, Expo SQLite)
 * ============================================================
 *
 * IMPORTANT:
 * This file follows the EXACT SAME PATTERN as database.ts
 * and daily logs DB usage.
 *
 * - Uses getDatabase()
 * - Uses execSync / getAllSync
 * - No transactions
 * - No async callbacks
 *
 * Do NOT refactor this file.
 */

import { getDatabase } from "./database";

/* ============================================================
 * Watchkeeping DB Row Shape
 * ============================================================ */

export type WatchEntryDB = {
  id: string;
  start_time: string;
  end_time: string;
  watch_type: string;
  ship_state: string;
  location: string;
  cargo_ops: number;
  cadet_discipline: string;
  remarks?: string | null;
  created_at: string;
};

/* ============================================================
 * Table Initialisation
 * ============================================================ */

export function initWatchkeepingTable(): void {
  const db = getDatabase();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS watchkeeping (
      id TEXT PRIMARY KEY NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      watch_type TEXT NOT NULL,
      ship_state TEXT NOT NULL,
      location TEXT NOT NULL,
      cargo_ops INTEGER NOT NULL,
      cadet_discipline TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

/* ============================================================
 * Fetch
 * ============================================================ */

export function getAllWatches(): WatchEntryDB[] {
  const db = getDatabase();

  return db.getAllSync<WatchEntryDB>(
    `SELECT * FROM watchkeeping ORDER BY start_time DESC;`
  );
}

/* ============================================================
 * Insert
 * ============================================================ */

export function insertWatch(entry: WatchEntryDB): void {
  const db = getDatabase();

db.execSync(`
  INSERT INTO watchkeeping (
    id,
    start_time,
    end_time,
    watch_type,
    ship_state,
    location,
    cargo_ops,
    cadet_discipline,
    remarks,
    created_at
  ) VALUES (
    '${entry.id}',
    '${entry.start_time}',
    '${entry.end_time}',
    '${entry.watch_type}',
    '${entry.ship_state}',
    '${entry.location}',
    ${entry.cargo_ops},
    '${entry.cadet_discipline}',
    ${entry.remarks ? `'${entry.remarks}'` : "NULL"},
    '${entry.created_at}'
  );
`);

}

/* ============================================================
 * Update
 * ============================================================ */

export function updateWatch(
  id: string,
  updates: Partial<WatchEntryDB>
): void {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  if (fields.length === 0) return;

    db.execSync(`
    UPDATE watchkeeping
    SET ${fields
        .map((f, i) => `${f.split(" = ")[0]} = '${values[i]}'`)
        .join(", ")}
    WHERE id = '${id}';
    `);

}

/* ============================================================
 * Delete
 * ============================================================ */

export function deleteWatchById(id: string): void {
  const db = getDatabase();

db.execSync(`
  DELETE FROM watchkeeping
  WHERE id = '${id}';
`);

}
/* ============================================================
 * STCW REST HOURS COMPLIANCE ENGINE
 * ============================================================
 *
 * PURPOSE:
 * - Evaluate STCW rest hour compliance
 * - Uses Daily / Bridge / Engine / Port logs
 * - NO UI
 * - NO DB writes
 *
 * RETURNS ONLY STATUS:
 * - COMPLIANT
 * - AT_RISK
 * - NON_COMPLIANT
 *
 * IMPORTANT:
 * - Midnight safe
 * - Inspector-grade logic
 * ============================================================ */

export type StcwComplianceStatus =
  | "COMPLIANT"
  | "AT_RISK"
  | "NON_COMPLIANT";

/**
 * Extract WORK periods from Daily Log entries.
 * Any entry with valid startTime & endTime counts as WORK.
 */
function extractWorkPeriods(
  entries: {
    startTime?: Date | null;
    endTime?: Date | null;
  }[]
): { start: Date; end: Date }[] {
  return entries
    .filter(
      (e) =>
        e.startTime instanceof Date &&
        e.endTime instanceof Date &&
        e.endTime.getTime() > e.startTime.getTime()
    )
    .map((e) => ({
      start: e.startTime as Date,
      end: e.endTime as Date,
    }));
}

/**
 * Calculate total WORK milliseconds inside a time window
 */
function calculateWorkMsInWindow(
  periods: { start: Date; end: Date }[],
  windowStart: Date,
  windowEnd: Date
): number {
  let workMs = 0;

  for (const p of periods) {
    const overlapStart = new Date(
      Math.max(p.start.getTime(), windowStart.getTime())
    );
    const overlapEnd = new Date(
      Math.min(p.end.getTime(), windowEnd.getTime())
    );

    if (overlapEnd > overlapStart) {
      workMs += overlapEnd.getTime() - overlapStart.getTime();
    }
  }

  return workMs;
}

/**
 * MAIN STCW COMPLIANCE CHECK
 *
 * STCW RULES APPLIED:
 * - Min 10 hours rest in any 24h
 * - Min 77 hours rest in any 7 days
 */
export function checkStcwCompliance(
  dailyLogEntries: {
    startTime?: Date | null;
    endTime?: Date | null;
  }[],
  now: Date
): StcwComplianceStatus {
  const workPeriods = extractWorkPeriods(dailyLogEntries);

  /* -------------------------------
   * RULE 1 — 24 HOURS
   * ------------------------------- */
  const window24Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const workMs24 = calculateWorkMsInWindow(
    workPeriods,
    window24Start,
    now
  );

  const restHours24 = 24 - workMs24 / (1000 * 60 * 60);

  if (restHours24 < 10) {
    return "NON_COMPLIANT";
  }

  /* -------------------------------
   * RULE 2 — 7 DAYS
   * ------------------------------- */
  const window7dStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const workMs7d = calculateWorkMsInWindow(
    workPeriods,
    window7dStart,
    now
  );

  const restHours7d = 168 - workMs7d / (1000 * 60 * 60);

  if (restHours7d < 77) {
    return "AT_RISK";
  }

  return "COMPLIANT";
}

