//keel-mobile/src/db/tasks.ts
import { getDatabase } from "./database";
import { TASK_SEED } from "./tasks/taskSeed"; 
import { Platform } from "react-native";

/**
 * ============================================================
 * Tasks — Local DB Adapter (Option A)
 * ============================================================
 *
 * PURPOSE:
 * - Offline-first persistence for Tasks
 * - Draft-safe and sync-ready (future backend)
 * - Stores Section/Category info for grouping (Function/Topic)
 *
 * IMPORTANT:
 * - NO UI imports here
 * - NO toast calls here (Screens/Contexts will handle toasts)
 * - Uses Expo SQLite SYNC API (runSync / getAllSync)
 *
 * TABLE (created in Step 2):
 * - task_records
 *
 * OPTION A MODEL:
 * - One row per task_key (stable identifier)
 * - Overwrite-safe upsert
 */

/**
 * Task status values used by DB.
 * Keep string literals stable for future sync mapping.
 */
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

/**
 * Sync states used by DB (future server sync).
 */
export type SyncState =
  | "LOCAL_ONLY"
  | "DIRTY"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT";

/**
 * Canonical Task record shape returned by this adapter.
 * Note: UI currently uses a different Status type ("pending"/"submitted").
 * We'll bridge that later during wiring without breaking screens.
 */
export type TaskRecord = {
  id: string; // primary key (string)
  taskKey: string; // stable key e.g. "D.1"
  taskTitle: string;
  status: TaskStatus;
  remarks: string | null;
  signedBy: string | null;
  signedRank: string | null;
  signedAt: string | null;
  remoteId: string | null;
  syncState: SyncState;
  
  // ✅ NEW FIELDS for Grouping
  sectionId: string | null;  // e.g. "Function 1"
  categoryId: string | null; // e.g. "Navigation"
  
  createdAt: string;
  updatedAt: string;
};

/**
 * HELPER: Ensure Columns Exist
 * Adds section_id/category_id if the table was created by an older version.
 * This runs silently and prevents crashes on schema updates.
 */
function ensureColumnsExist() {
  const db = getDatabase();
  try {
    // Attempt to add columns. If they exist, SQLite will throw an error which we ignore.
    // This is a standard lightweight migration pattern for SQLite.
    try { db.execSync(`ALTER TABLE task_records ADD COLUMN section_id TEXT;`); } catch(e) {}
    try { db.execSync(`ALTER TABLE task_records ADD COLUMN category_id TEXT;`); } catch(e) {}
  } catch (e) {
    console.log("Schema check skipped (DB might be locked or ready)");
  }
}

/**
 * SMART SYNC: Merges Backend Tasks with Local Progress
 * * Rules:
 * 1. If task is NEW -> Insert it with status 'NOT_STARTED'.
 * 2. If task EXISTS -> Update Title/Description/Grouping (Shore might have fixed a typo), 
 * but KEEP the local 'status', 'evidence_count', and 'completed_date'.
 */
export const syncTasksFromShore = (serverTasks: any[]): Promise<void> => {
  const db = getDatabase();
  
  // 1. Ensure Schema is up to date before writing
  ensureColumnsExist();

  return new Promise((resolve, reject) => {
    try {
      // Use synchronous transaction for consistency and speed
      db.withTransactionSync(() => {
        serverTasks.forEach(task => {
          // Generate IDs consistent with local pattern
          // We assume shore task has 'id' (remote_id) and 'task_key' (or we use id as key)
          const taskKey = task.task_key || task.code || `R-${task.id}`;
          const localId = `TASK_${taskKey}`;
          const now = new Date().toISOString();

          // 2. Try to insert new task (will fail silently if ID exists due to conflict)
          // We map Shore fields to our Local Schema
          db.runSync(
            `INSERT OR IGNORE INTO task_records (
              id, task_key, task_title, status, 
              remarks, signed_by, signed_rank, signed_at,
              remote_id, sync_state, created_at, updated_at,
              section_id, category_id
             ) VALUES (?, ?, ?, 'NOT_STARTED', ?, NULL, NULL, NULL, ?, 'SYNCED', ?, ?, ?, ?);`,
            [
              localId,
              taskKey,
              task.title,
              task.description || null, // Map desc to remarks for now if desired
              task.id, // Store shore ID as remote_id
              now,
              now,
              task.section,  // ✅ Saving Section (Function)
              task.category  // ✅ Saving Category (Topic)
            ]
          );

          // 3. Update definition (Title/Group) but PRESERVE Status
          // This ensures if Shore Admin renames "Mop Deck" to "Sanitize Deck",
          // the cadet sees the new name but keeps their "COMPLETED" checkmark.
          db.runSync(
            `UPDATE task_records 
             SET task_title = ?, remote_id = ?, updated_at = ?, section_id = ?, category_id = ?
             WHERE id = ?;`,
            [task.title, task.id, now, task.section, task.category, localId]
          );
        });
      });
      
      console.log(`✅ Synced ${serverTasks.length} tasks from Shore.`);
      resolve();
    } catch (error) {
      console.error("Task Sync Failed:", error);
      reject(error);
    }
  });
};

/**
 * ============================================================
 * Seed Tasks (Temporary Catalog)
 * ============================================================
 *
 * Right now TaskListScreen uses a hardcoded list.
 * To keep this adapter usable immediately (offline-first),
 * we provide a minimal seed list that matches your current UI placeholders.
 *
 * Later, when backend task templates exist, we will:
 * - replace/extend this seed
 * - add a "task_templates" table if needed
 */
const SEED_TASKS: { taskKey: string; taskTitle: string }[] = [
  { taskKey: "D.1", taskTitle: "Identify bridge layout" },
  { taskKey: "D.2", taskTitle: "Explain radar components" },
];

/**
 * ============================================================
 * ensureSeedTasksExist
 * ============================================================
 * Inserts seed tasks ONLY if task_records is empty.
 *
 * Why:
 * - prevents duplicates
 * - keeps this step backward-safe
 */
export function ensureSeedTasksExist(): void {
  const db = getDatabase();
  ensureColumnsExist(); // Ensure columns exist before seeding

  const rows = db.getAllSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM task_records;`
  );

  const count = rows?.[0]?.count ?? 0;
  if (count > 0) return;

  const now = new Date().toISOString();

  for (const task of TASK_SEED) {
    const id = `TASK_${task.taskKey}`;

    db.runSync(
      `
      INSERT INTO task_records (
        id,
        task_key,
        task_title,
        status,
        remarks,
        signed_by,
        signed_rank,
        signed_at,
        remote_id,
        sync_state,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        task.taskKey,
        task.taskTitle,
        "NOT_STARTED",
        null,
        null,
        null,
        null,
        null,
        "LOCAL_ONLY",
        now,
        now,
      ]
    );
  }
}

/**
 * ============================================================
 * getAllTaskRecords
 * ============================================================
 * Reads all tasks from DB, ordered by task_key.
 */
export function getAllTaskRecords(): TaskRecord[] {
  const db = getDatabase();
  ensureColumnsExist(); // Ensure columns exist before reading

  // ✅ UPDATED: Select section_id and category_id
  const result = db.getAllSync<TaskRecord>(
    `
    SELECT
      id,
      task_key AS taskKey,
      task_title AS taskTitle,
      status,
      remarks,
      signed_by AS signedBy,
      signed_rank AS signedRank,
      signed_at AS signedAt,
      remote_id AS remoteId,
      sync_state AS syncState,
      section_id AS sectionId,   
      category_id AS categoryId,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM task_records
    ORDER BY task_key ASC
    `
  );

  return result ?? [];
}

/**
 * ============================================================
 * upsertTaskStatus
 * ============================================================
 * Updates task status + optional remarks.
 *
 * Use cases:
 * - User starts work → IN_PROGRESS
 * - User completes + submits → COMPLETED (or keep IN_PROGRESS + signed fields later)
 */
export function upsertTaskStatus(args: {
  taskKey: string;
  taskTitle?: string;
  status: TaskStatus;
  remarks?: string | null;
}): void {
  const db = getDatabase();
  ensureColumnsExist(); // Ensure columns exist before writing

  const nowIso = new Date().toISOString();
  const id = `TASK_${args.taskKey}`;

  db.runSync(
    `
    INSERT INTO task_records (
      id, task_key, task_title, status, remarks, 
      sync_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'DIRTY', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      task_title = excluded.task_title,
      status = excluded.status,
      remarks = excluded.remarks,
      sync_state = 'DIRTY',
      updated_at = excluded.updated_at
    `,
    [
      id,
      args.taskKey,
      args.taskTitle ?? args.taskKey, // safe fallback
      args.status,
      args.remarks ?? null,
      nowIso,
      nowIso,
    ]
  );
}

/**
 * ============================================================
 * getTaskByKey
 * ============================================================
 * Fetch one task by taskKey.
 */
export function getTaskByKey(taskKey: string): TaskRecord | null {
  const db = getDatabase();
  ensureColumnsExist(); // Ensure columns exist before reading
  
  const id = `TASK_${taskKey}`;

  const rows = db.getAllSync<any>(
    `SELECT * FROM task_records WHERE id = ? LIMIT 1`,
    [id]
  );

  if (!rows || rows.length === 0) return null;
  
  // Map snake_case DB columns to camelCase JS object
  const row = rows[0];
  return {
      id: row.id,
      taskKey: row.task_key,
      taskTitle: row.task_title,
      status: row.status,
      remarks: row.remarks,
      signedBy: row.signed_by,
      signedRank: row.signed_rank,
      signedAt: row.signed_at,
      remoteId: row.remote_id,
      syncState: row.sync_state,
      sectionId: row.section_id,   // ✅ Mapped
      categoryId: row.category_id, // ✅ Mapped
      createdAt: row.created_at,
      updatedAt: row.updated_at
  };
}