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
  createdAt: string;
  updatedAt: string;
};

/**
 * SMART SYNC: Merges Backend Tasks with Local Progress
 * * Rules:
 * 1. If task is NEW -> Insert it with status 'NOT_STARTED'.
 * 2. If task EXISTS -> Update Title/Description (Shore might have fixed a typo), 
 * but KEEP the local 'status', 'evidence_count', and 'completed_date'.
 */
export const syncTasksFromShore = (serverTasks: any[]): Promise<void> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    try {
      // Use synchronous transaction for consistency with the rest of the file
      db.withTransactionSync(() => {
        serverTasks.forEach(task => {
          // Generate IDs consistent with local pattern
          // We assume shore task has 'id' (remote_id) and 'task_key' (or we use id as key)
          const taskKey = task.task_key || task.code || `R-${task.id}`;
          const localId = `TASK_${taskKey}`;
          const now = new Date().toISOString();

          // 1. Try to insert new task (will fail silently if ID exists)
          // We map Shore fields to our Local Schema
          db.runSync(
            `INSERT OR IGNORE INTO task_records (
              id, task_key, task_title, status, 
              remarks, signed_by, signed_rank, signed_at,
              remote_id, sync_state, created_at, updated_at
             ) VALUES (?, ?, ?, 'NOT_STARTED', ?, NULL, NULL, NULL, ?, 'SYNCED', ?, ?);`,
            [
              localId,
              taskKey,
              task.title,
              task.description || null, // Map desc to remarks for now if desired
              task.id, // Store shore ID as remote_id
              now,
              now
            ]
          );

          // 2. Update definition (Title) but PRESERVE Status
          // This ensures if Shore Admin renames "Mop Deck" to "Sanitize Deck",
          // the cadet sees the new name but keeps their "COMPLETED" checkmark.
          db.runSync(
            `UPDATE task_records 
             SET task_title = ?, remote_id = ?, updated_at = ?
             WHERE id = ?;`,
            [task.title, task.id, now, localId]
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

  const nowIso = new Date().toISOString();
  const id = `TASK_${args.taskKey}`;

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
    ) VALUES (
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?
    )
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
      null,
      null,
      null,
      null,
      "DIRTY",
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
  const id = `TASK_${taskKey}`;

  const rows = db.getAllSync<TaskRecord>(
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
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM task_records
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows?.[0] ?? null;
}