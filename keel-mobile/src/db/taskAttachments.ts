// keel-mobile/src/db/taskAttachments.ts
import { getDatabase } from "./database";

/**
 * ============================================================
 * Task Attachments — Local DB Adapter (Offline-First)
 * ============================================================
 */

export type TaskAttachmentKind = "PHOTO" | "DOCUMENT";

export type SyncState =
  | "LOCAL_ONLY"
  | "DIRTY"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT";

export type TaskAttachmentRecord = {
  id: string;                 
  taskKey: string;            
  kind: TaskAttachmentKind;   
  fileName: string;
  localUri: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;          
  createdBy: string | null;   
  syncState: SyncState;
  deletedAt: string | null;   
};

/**
 * ensureTaskAttachmentsTable
 * Creates the task_attachments table if it does not exist.
 */
export function ensureTaskAttachmentsTable(): void {
  const db = getDatabase();

  db.runSync(`
    CREATE TABLE IF NOT EXISTS task_attachments (
      id TEXT PRIMARY KEY,
      task_key TEXT NOT NULL,
      kind TEXT NOT NULL,
      file_name TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      created_at TEXT NOT NULL,
      created_by TEXT,
      sync_state TEXT NOT NULL DEFAULT 'LOCAL_ONLY',
      deleted_at TEXT
    );
  `);
}

/**
 * getAttachmentsForTask
 * Returns all NON-DELETED attachments for a task.
 */
export function getAttachmentsForTask(
  taskKey: string
): TaskAttachmentRecord[] {
  ensureTaskAttachmentsTable();
  const db = getDatabase();

  const rows = db.getAllSync<TaskAttachmentRecord>(
    `
    SELECT
      id,
      task_key AS taskKey,
      kind,
      file_name AS fileName,
      local_uri AS localUri,
      mime_type AS mimeType,
      size_bytes AS sizeBytes,
      created_at AS createdAt,
      created_by AS createdBy,
      sync_state AS syncState,
      deleted_at AS deletedAt
    FROM task_attachments
    WHERE task_key = ?
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    `,
    [taskKey]
  );

  return rows ?? [];
}

/**
 * insertTaskAttachment
 */
export function insertTaskAttachment(args: {
  id: string;
  taskKey: string;
  kind: TaskAttachmentKind;
  fileName: string;
  localUri: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdBy?: string | null;
}): void {
  ensureTaskAttachmentsTable();
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.runSync(
    `
    INSERT INTO task_attachments (
      id,
      task_key,
      kind,
      file_name,
      local_uri,
      mime_type,
      size_bytes,
      created_at,
      created_by,
      sync_state,
      deleted_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `,
    [
      args.id,
      args.taskKey,
      args.kind,
      args.fileName,
      args.localUri,
      args.mimeType ?? null,
      args.sizeBytes ?? null,
      nowIso,
      args.createdBy ?? null,
      "LOCAL_ONLY",
      null,
    ]
  );
}

/**
 * softDeleteTaskAttachment
 */
export function softDeleteTaskAttachment(
  attachmentId: string
): void {
  ensureTaskAttachmentsTable();
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.runSync(
    `
    UPDATE task_attachments
    SET deleted_at = ?, sync_state = 'DIRTY'
    WHERE id = ?
    `,
    [nowIso, attachmentId]
  );
}

/**
 * getPendingAttachments
 */
export function getPendingAttachments(): TaskAttachmentRecord[] {
  // ✅ CRITICAL FIX: Ensure table exists before querying
  ensureTaskAttachmentsTable();
  const db = getDatabase();

  try {
    const rows = db.getAllSync<any>(
      `
      SELECT
        id,
        task_key AS taskKey,
        kind,
        file_name AS fileName,
        local_uri AS localUri,
        mime_type AS mimeType,
        size_bytes AS sizeBytes,
        created_at AS createdAt,
        created_by AS createdBy,
        sync_state AS syncState,
        deleted_at AS deletedAt
      FROM task_attachments
      WHERE (sync_state = 'LOCAL_ONLY' OR sync_state = 'DIRTY')
        AND deleted_at IS NULL
      LIMIT 50
      `
    );

    return rows ?? [];
  } catch (error) {
    console.error("Failed to fetch pending attachments:", error);
    return [];
  }
}

/**
 * markAttachmentAsSynced
 */
export function markAttachmentAsSynced(id: string): void {
  ensureTaskAttachmentsTable();
  const db = getDatabase();
  db.runSync(
    `UPDATE task_attachments SET sync_state = 'SYNCED' WHERE id = ?`,
    [id]
  );
}