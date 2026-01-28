//keel-mobile/src/db/tasks.ts

import { getDatabase } from "./database";
import { Platform } from "react-native";

/**
 * NOT_STARTED: Initial state
 * IN_PROGRESS: Cadet is working on it
 * PENDING_REVIEW: Cadet has submitted, waiting for Officer signature
 * COMPLETED: Officer has signed off
 */
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED";
export type SyncState = "LOCAL_ONLY" | "DIRTY" | "SYNCING" | "SYNCED" | "CONFLICT";

export type TaskRecord = {
  id: string; 
  taskKey: string; 
  taskTitle: string;        
  taskDescription: string;  
  status: TaskStatus;
  remarks: string | null;
  signedBy: string | null;
  signedRank: string | null;
  signedAt: string | null;
  remoteId: string | null;
  syncState: SyncState;
  sectionId: string | null; 
  categoryId: string | null; 
  instructions: string | null;
  stcwCode: string | null;
  safetyLevel: string | null;
  frequency: string | null;
  evidenceType: string | null;
  createdAt: string;
  updatedAt: string;
};

// SESSION LOCK: Prevents multiple contexts from re-syncing/re-logging in the same session.
let SESSION_SYNC_COMPLETE = false;

/**
 * Ensures all necessary columns exist in the SQLite table.
 * Added support for the updated maritime training metadata.
 */
function ensureColumnsExist() {
  const db = getDatabase();
  try {
    const cols = [
      "section_id TEXT", "category_id TEXT",
      "task_description TEXT", "instructions TEXT", 
      "stcw_code TEXT", "safety_level TEXT", "frequency TEXT",
      "evidence_type TEXT"
    ];
    cols.forEach(col => {
      try { db.execSync(`ALTER TABLE task_records ADD COLUMN ${col};`); } catch(e) {}
    });
  } catch (e) {}
}

export const syncTasksFromShore = (serverTasks: any[]): Promise<void> => {
  // GATEKEEPER: Return immediately if already synced this session
  if (SESSION_SYNC_COMPLETE) {
    return Promise.resolve();
  }

  const db = getDatabase();
  ensureColumnsExist();

  return new Promise((resolve, reject) => {
    try {
      console.log(`>>> TASKS RECEIVED: ${serverTasks.length}`);
      
      db.withTransactionSync(() => {
        serverTasks.forEach(task => {
          const taskKey = task.task_key || task.code || `R-${task.id}`;
          const localId = `TASK_${taskKey}`;
          const now = new Date().toISOString();

          // 1. INSERT if it doesn't exist
          db.runSync(
            `INSERT OR IGNORE INTO task_records (
              id, task_key, task_title, task_description, status, 
              remarks, signed_by, signed_rank, signed_at,
              remote_id, sync_state, created_at, updated_at,
              section_id, category_id,
              instructions, stcw_code, safety_level, frequency, evidence_type
             ) VALUES (?, ?, ?, ?, 'NOT_STARTED', ?, NULL, NULL, NULL, ?, 'SYNCED', ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              localId, taskKey, task.title, task.description, 
              null, 
              task.id, now, now,
              task.section, task.category,
              task.instructions, task.stcw_code, task.safety_level, task.frequency, 
              task.evidence 
            ]
          );

          // 2. UPDATE (Keep local status/remarks if they exist, update metadata only)
          db.runSync(
            `UPDATE task_records 
             SET task_title = ?, task_description = ?, remote_id = ?, updated_at = ?, 
                 section_id = ?, category_id = ?,
                 instructions = ?, stcw_code = ?, safety_level = ?, frequency = ?, evidence_type = ?
             WHERE id = ?;`,
            [
              task.title, task.description, task.id, now, 
              task.section, task.category,
              task.instructions, task.stcw_code, task.safety_level, task.frequency, task.evidence,
              localId
            ]
          );
        });
      });

      console.log(">>> TASKS SAVED TO DB");
      SESSION_SYNC_COMPLETE = true; 
      resolve();
    } catch (error) {
      console.error("Task Sync Failed:", error);
      reject(error);
    }
  });
};

/**
 * Retrieves all tasks for the list views.
 */
export function getAllTaskRecords(): TaskRecord[] {
  const db = getDatabase();
  const result = db.getAllSync<any>(`SELECT * FROM task_records ORDER BY task_key ASC`);
  return result.map(row => ({
      id: row.id,
      taskKey: row.task_key,
      taskTitle: row.task_title,
      taskDescription: row.task_description || row.task_title,
      status: row.status,
      remarks: row.remarks,
      signedBy: row.signed_by,
      signedRank: row.signed_rank,
      signedAt: row.signed_at,
      remoteId: row.remote_id,
      syncState: row.sync_state,
      sectionId: row.section_id,   
      categoryId: row.category_id, 
      instructions: row.instructions,
      stcwCode: row.stcw_code,
      safetyLevel: row.safety_level,
      frequency: row.frequency,
      evidenceType: row.evidence_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
  }));
}

/**
 * Updates or Inserts a task status. 
 * Marks the record as 'DIRTY' so the SyncService knows to push it to the server.
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
    `INSERT INTO task_records (id, task_key, task_title, status, remarks, sync_state, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, 'DIRTY', ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, remarks = excluded.remarks, sync_state = 'DIRTY', updated_at = excluded.updated_at`,
    [id, args.taskKey, args.taskTitle ?? args.taskKey, args.status, args.remarks ?? null, nowIso, nowIso]
  );
}

/**
 * Fetches a single task by its key (e.g., 'D-1.1')
 */
export function getTaskByKey(taskKey: string): TaskRecord | null {
  const db = getDatabase();
  const id = `TASK_${taskKey}`;
  const rows = db.getAllSync<any>(`SELECT * FROM task_records WHERE id = ? LIMIT 1`, [id]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  
  return {
      id: row.id,
      taskKey: row.task_key,
      taskTitle: row.task_title,
      taskDescription: row.task_description || row.task_title,
      status: row.status,
      remarks: row.remarks,
      signedBy: row.signed_by,
      signedRank: row.signed_rank,
      signedAt: row.signed_at,
      remoteId: row.remote_id,
      syncState: row.sync_state,
      sectionId: row.section_id,   
      categoryId: row.category_id, 
      instructions: row.instructions,
      stcwCode: row.stcw_code,
      safetyLevel: row.safety_level,
      frequency: row.frequency,
      evidenceType: row.evidence_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
  };
}

export function ensureSeedTasksExist() { 
  return; 
}