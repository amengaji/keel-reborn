//keel-mobile/src/db/tasks.ts
import { getDatabase } from "./database";
import { Platform } from "react-native";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
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
  const db = getDatabase();
  ensureColumnsExist();

  return new Promise((resolve, reject) => {
    try {
      db.withTransactionSync(() => {
        serverTasks.forEach(task => {
          const taskKey = task.task_key || task.code || `R-${task.id}`;
          const localId = `TASK_${taskKey}`;
          const now = new Date().toISOString();

          // 1. INSERT
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
              // ✅ FIX: Force remarks to NULL on initial sync. Do NOT use description.
              null, 
              task.id, now, now,
              task.section, task.category,
              task.instructions, task.stcw_code, task.safety_level, task.frequency, 
              task.evidence 
            ]
          );

          // 2. UPDATE (Keep local status/remarks if they exist, only update metadata)
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
      resolve();
    } catch (error) {
      console.error("Task Sync Failed:", error);
      reject(error);
    }
  });
};

export function getAllTaskRecords(): TaskRecord[] {
  const db = getDatabase();
  ensureColumnsExist(); 
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

export function upsertTaskStatus(args: {
  taskKey: string;
  taskTitle?: string;
  status: TaskStatus;
  remarks?: string | null;
}): void {
  const db = getDatabase();
  ensureColumnsExist();
  const nowIso = new Date().toISOString();
  const id = `TASK_${args.taskKey}`;

  db.runSync(
    `INSERT INTO task_records (id, task_key, task_title, status, remarks, sync_state, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, 'DIRTY', ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, remarks = excluded.remarks, sync_state = 'DIRTY', updated_at = excluded.updated_at`,
    [id, args.taskKey, args.taskTitle ?? args.taskKey, args.status, args.remarks ?? null, nowIso, nowIso]
  );
}

export function getTaskByKey(taskKey: string): TaskRecord | null {
  const db = getDatabase();
  ensureColumnsExist(); 
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

export function ensureSeedTasksExist() { return; }