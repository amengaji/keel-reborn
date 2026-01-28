//keel-mobile/src/db/database.ts
import * as SQLite from "expo-sqlite";
import { ensureDailyLogsTable } from "./dailyLogs";
import { ensureSeedTasksExist } from "./tasks";

let isDbInitialized = false;

export const initializeAppDatabase = async () => {
  if (isDbInitialized) return;
  
  console.log(">>> [DB] STARTING ONE-TIME INITIALIZATION");
  try {
    ensureDailyLogsTable(); // Schema checks
    ensureSeedTasksExist(); // Task seeding
    isDbInitialized = true;
    console.log(">>> [DB] INITIALIZATION COMPLETE");
  } catch (error) {
    console.error(">>> [DB] INIT FAILED:", error);
  }
};

/**
 * ============================================================
 * KEEL Local Database (SQLite)
 * ============================================================
 *
 * DESIGN GUARANTEES:
 * - NO breaking changes to existing installs
 * - ONLY additive schema changes
 * - Draft-safe for all modules
 * - Offline-first
 * - Inspector-grade data integrity
 *
 * EXISTING TABLES (UNCHANGED):
 * - daily_logs
 * - watchkeeping
 *
 * SEA SERVICE (UPGRADED IN THIS STEP):
 * - sea_service_records now supports:
 * - Multiple records (history)
 * - Exactly ONE active DRAFT at a time (enforced by DB index)
 *
 * NEW TABLES (UNCHANGED HERE):
 * - task_records
 */

/**
 * Singleton database instance
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get (or create) the KEEL local database.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("keel.db");
  }
  return db;
}

/**
 * ============================================================
 * Migration Helper: ensureColumns
 * ============================================================
 * Adds columns if they do not exist (SAFE migration).
 * NEVER drops or alters existing columns.
 */
function ensureColumns(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columns: { name: string; type: string }[]
): void {
  const rows = database.getAllSync<{ name: string }>(
    `PRAGMA table_info(${tableName});`
  );

  const existing = new Set((rows ?? []).map((r) => r.name));

  for (const col of columns) {
    if (existing.has(col.name)) continue;

    database.execSync(
      `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`
    );
  }
}

/**
 * ============================================================
 * initDatabase
 * ============================================================
 * Creates schema for fresh installs + runs SAFE migrations.
 */
export function initDatabase(): void {
  const database = getDatabase();

  /* ==========================================================
   * DAILY LOGS (EXISTING — DO NOT MODIFY)
   * ========================================================== */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,

      port_watch_type TEXT,

      start_time TEXT,
      end_time TEXT,
      summary TEXT NOT NULL,
      remarks TEXT,

      lat_deg INTEGER,
      lat_min REAL,
      lat_dir TEXT,

      lon_deg INTEGER,
      lon_min REAL,
      lon_dir TEXT,

      course_deg REAL,
      speed_kn REAL,
      weather TEXT,
      steering_minutes INTEGER,
      is_lookout INTEGER,
      daily_work_categories TEXT,

      machinery_monitored TEXT,
      created_at TEXT NOT NULL
    );
  `);

  /* ==========================================================
 * WATCHKEEPING (NEW — SAFE ADDITIVE)
 * ========================================================== */
database.execSync(`
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


  ensureColumns(database, "daily_logs", [
    { name: "port_watch_type", type: "TEXT" },
    { name: "lat_deg", type: "INTEGER" },
    { name: "lat_min", type: "REAL" },
    { name: "lat_dir", type: "TEXT" },
    { name: "lon_deg", type: "INTEGER" },
    { name: "lon_min", type: "REAL" },
    { name: "lon_dir", type: "TEXT" },
    { name: "course_deg", type: "REAL" },
    { name: "speed_kn", type: "REAL" },
    { name: "weather", type: "TEXT" },
    { name: "steering_minutes", type: "INTEGER" },
    { name: "is_lookout", type: "INTEGER" },
    { name: "daily_work_categories", type: "TEXT" },
    { name: "machinery_monitored", type: "TEXT" },
  ]);

  /* ==========================================================
   * SEA SERVICE (OPTION 3 — HYBRID)
   * ==========================================================
   *
   * Key business rule:
   * - Multiple Sea Service records are allowed (history)
   * - Exactly ONE can be status='DRAFT' at any time
   *
   * Why enforce at DB layer?
   * - Prevents edge cases/offline race conditions
   * - Guarantees audit-grade integrity
   */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS sea_service_records (
      id TEXT PRIMARY KEY NOT NULL,

      -- Vessel identity (duplicated for fast dashboard listing/search)
      ship_name TEXT,
      imo_number TEXT,

      -- Service period (ISO date strings: "YYYY-MM-DD")
      -- These are duplicated for fast dashboard listing/filtering.
      sign_on_date TEXT,
      sign_off_date TEXT,

      -- Entire Sea Service payload (JSON)
      payload_json TEXT NOT NULL,

      -- Draft lifecycle
      status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | FINAL
      last_updated_at INTEGER,

      -- Future sync support
      remote_id TEXT,
      sync_state TEXT DEFAULT 'LOCAL_ONLY',

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  /**
   * SAFE migrations for existing installs:
   * - Add service period columns (for dashboard listing)
   */
  ensureColumns(database, "sea_service_records", [
    { name: "sign_on_date", type: "TEXT" },
    { name: "sign_off_date", type: "TEXT" },
  ]);

  /**
   * Enforce ONLY ONE DRAFT record (critical Option 3 rule).
   * This is a partial unique index:
   * - Applies ONLY to rows where status='DRAFT'
   * - Allows unlimited FINAL records
   */
  database.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sea_service_single_draft
    ON sea_service_records(status)
    WHERE status = 'DRAFT';
  `);

  /**
   * Helpful indexes for history sorting and listing.
   * (Does not enforce rules, only speeds up queries.)
   */
  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_sea_service_status_updated
    ON sea_service_records(status, updated_at);
  `);

  /* ==========================================================
   * TASKS (NEW — OPTION A)  (UNCHANGED)
   * ========================================================== */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS task_records (
      id TEXT PRIMARY KEY NOT NULL,

      task_key TEXT NOT NULL,        -- stable identifier from task catalog
      task_title TEXT NOT NULL,

      -- Task completion state
      status TEXT NOT NULL,          -- NOT_STARTED | IN_PROGRESS | COMPLETED
      remarks TEXT,

      -- Sign-off metadata (future-proof)
      signed_by TEXT,
      signed_rank TEXT,
      signed_at TEXT,

      -- Draft + sync
      remote_id TEXT,
      sync_state TEXT DEFAULT 'LOCAL_ONLY',

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

    /* ==========================================================
   * TASK GUIDANCE (NEW — READ-ONLY TEMPLATES)
   * ==========================================================
   *
   * PURPOSE:
   * - Store training guidance for each task
   * - NOT cadet data
   * - NOT voyage-specific
   * - Inspector / PSC safe
   *
   * IMPORTANT:
   * - Cadets cannot modify this data
   * - Seeded once, extendable later via admin tools
   */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS task_guidance (
      id TEXT PRIMARY KEY NOT NULL,

      -- Stable link to task catalog
      task_key TEXT NOT NULL UNIQUE,

      -- Classification (for future filtering / analytics)
      stream TEXT NOT NULL,        -- deck | engine | rating
      section TEXT NOT NULL,       -- navigation, bridge, machinery, safety, etc.

      -- Guidance content (READ-ONLY)
      purpose TEXT NOT NULL,
      steps TEXT NOT NULL,
      common_mistakes TEXT,
      evidence_expected TEXT,
      officer_expectation TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

}