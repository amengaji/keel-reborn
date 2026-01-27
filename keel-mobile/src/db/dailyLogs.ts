//keel-mobile/src/db/dailyLogs.ts

import { getDatabase } from "./database";

/**
 * DailyLogRecord
 * --------------
 * Represents a single day's activity log using the Time Painter architecture.
 */
export type DailyLogRecord = {
  id: string;
  date: string; // YYYY-MM-DD (Unique Constraint)
  vesselName: string | null;
  positionLat: string | null;
  positionLong: string | null;
  activityJson: string; // Time Painter Data (Array of 48 ints)
  totalRest: number;
  totalWork: number;
  totalWatch: number;
  remarks: string | null;
  syncState: "DIRTY" | "SYNCED";
  updatedAt: string;
};

/**
 * INIT: Ensure Table Exists & Migrate if Needed
 */
export function ensureDailyLogsTable() {
  const db = getDatabase();
  try {
    // 1. Check if the table exists and has the new 'vessel_name' column
    // We try a dummy select to test the schema
    db.execSync(`SELECT vessel_name FROM daily_logs LIMIT 1`);
  } catch (e) {
    // 2. If SELECT fails, it means the column is missing (Old Schema).
    // We must DROP and RECREATE to support the new Time Painter architecture.
    console.log("Migrating daily_logs table to new schema...");
    try {
        db.execSync(`DROP TABLE IF EXISTS daily_logs`);
    } catch(dropErr) {
        console.error("Error dropping old table", dropErr);
    }
  }

  // 3. Create the Table (New Schema)
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        vessel_name TEXT,
        position_lat TEXT,
        position_long TEXT,
        activity_json TEXT DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
        total_rest REAL DEFAULT 0,
        total_work REAL DEFAULT 0,
        total_watch REAL DEFAULT 0,
        remarks TEXT,
        sync_state TEXT DEFAULT 'DIRTY',
        updated_at TEXT
      );
    `);
  } catch (e) {
    console.error("Failed to init daily_logs table", e);
  }
}

/**
 * GET: Retrieve Log by Date
 */
export function getLogByDate(date: string): DailyLogRecord | null {
  const db = getDatabase();
  ensureDailyLogsTable();
  
  try {
    const rows = db.getAllSync<any>(`SELECT * FROM daily_logs WHERE date = ? LIMIT 1`, [date]);
    if (!rows || rows.length === 0) return null;
    return mapRowToRecord(rows[0]);
  } catch (e) {
    console.error("Error fetching log by date:", e);
    return null;
  }
}

/**
 * GET ALL: Retrieve All Logs (Prevents Crash in Context)
 */
export function getAllDailyLogs(): DailyLogRecord[] {
  const db = getDatabase();
  ensureDailyLogsTable();
  
  try {
    const rows = db.getAllSync<any>(`SELECT * FROM daily_logs ORDER BY date DESC`);
    return rows.map(mapRowToRecord);
  } catch (e) {
    console.error("Error fetching all logs:", e);
    return [];
  }
}

/**
 * UPSERT: Insert or Update Log
 */
export function upsertDailyLog(log: Partial<DailyLogRecord> & { date: string }) {
  const db = getDatabase();
  ensureDailyLogsTable();
  
  const now = new Date().toISOString();
  const id = log.id || `LOG_${log.date}`;
  const defaultActivity = JSON.stringify(new Array(48).fill(0));

  try {
    db.runSync(`
      INSERT INTO daily_logs (
          id, date, vessel_name, position_lat, position_long, 
          activity_json, total_rest, total_work, total_watch, 
          remarks, sync_state, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DIRTY', ?)
      ON CONFLICT(date) DO UPDATE SET
          vessel_name = excluded.vessel_name,
          position_lat = excluded.position_lat,
          position_long = excluded.position_long,
          activity_json = excluded.activity_json,
          total_rest = excluded.total_rest,
          total_work = excluded.total_work,
          total_watch = excluded.total_watch,
          remarks = excluded.remarks,
          sync_state = 'DIRTY',
          updated_at = excluded.updated_at
    `, [
      id, 
      log.date, 
      log.vesselName || null, 
      log.positionLat || null, 
      log.positionLong || null,
      log.activityJson || defaultActivity,
      log.totalRest || 0, 
      log.totalWork || 0, 
      log.totalWatch || 0,
      log.remarks || null, 
      now
    ]);
  } catch (e) {
    console.error("Error upserting daily log:", e);
    throw e;
  }
}

/**
 * DELETE: Remove Log
 */
export function deleteDailyLogById(id: string) {
    const db = getDatabase();
    ensureDailyLogsTable();
    db.runSync(`DELETE FROM daily_logs WHERE id = ?`, [id]);
}

/**
 * Helper: Map DB Row to TS Record
 */
function mapRowToRecord(row: any): DailyLogRecord {
    return {
        id: row.id,
        date: row.date,
        vesselName: row.vessel_name,
        positionLat: row.position_lat,
        positionLong: row.position_long,
        activityJson: row.activity_json,
        totalRest: row.total_rest,
        totalWork: row.total_work,
        totalWatch: row.total_watch,
        remarks: row.remarks,
        syncState: row.sync_state as "DIRTY" | "SYNCED",
        updatedAt: row.updated_at
    };
}