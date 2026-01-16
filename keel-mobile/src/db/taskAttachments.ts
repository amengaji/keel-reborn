// keel-mobile/src/db/taskAttachments.ts
import { getDatabase } from "./database";

/**
 * ============================================================
 * Task Attachments — Local DB Adapter (Offline-First)
 * ============================================================
 *
 * PURPOSE:
 * - Persist task evidence (photos, PDFs) locally
 * - One task → many attachments
 * - PSC / audit safe
 * - Future backend sync ready
 *
 * IMPORTANT RULES:
 * - NO UI imports
 * - NO toast calls
 * - NO file-system side effects here
 * - Screens decide WHEN to block actions (e.g. COMPLETED)
 *
 * TABLE:
 * - task_attachments
 *
 * DELETION MODEL:
 * - Soft delete via deleted_at
 * - UI should prevent deletes after COMPLETED
 */

/* ============================================================
   Types
   ============================================================ */

/**
 * Attachment kind.
 * Keep literals stable for future sync.
 */
export type TaskAttachmentKind = "PHOTO" | "DOCUMENT";

/**
 * Sync states (mirrors tasks.ts for consistency).
 */
export type SyncState =
  | "LOCAL_ONLY"
  | "DIRTY"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT";

/**
 * Canonical attachment record returned by this adapter.
 */
export type TaskAttachmentRecord = {
  id: string;                 // primary key (UUID / stable id)
  taskKey: string;            // e.g. "D.1"
  kind: TaskAttachmentKind;   // PHOTO | DOCUMENT
  fileName: string;
  localUri: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;          // ISO timestamp
  createdBy: string | null;   // placeholder (future user id)
  syncState: SyncState;
  deletedAt: string | null;   // soft delete marker
};

/* ============================================================
   Table creation (idempotent)
   ============================================================ */

/**
 * ensureTaskAttachmentsTable
 *
 * Creates the task_attachments table if it does not exist.
 * Safe to call multiple times.
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
      sync_state TEXT NOT NULL,
      deleted_at TEXT
    );
  `);
}

/* ============================================================
   Queries
   ============================================================ */

/**
 * getAttachmentsForTask
 *
 * Returns all NON-DELETED attachments for a task.
 */
export function getAttachmentsForTask(
  taskKey: string
): TaskAttachmentRecord[] {
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
 *
 * Inserts a new attachment record.
 * File must already exist locally.
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
 *
 * Marks an attachment as deleted.
 * Actual file cleanup (if any) is handled by the caller.
 */
export function softDeleteTaskAttachment(
  attachmentId: string
): void {
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
