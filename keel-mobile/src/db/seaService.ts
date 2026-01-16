//keel-mobile/src/db/seaService.ts

import { getDatabase } from "./database";
import {
  DEFAULT_SEA_SERVICE_PAYLOAD,
  SeaServicePayload,
} from "../sea-service/seaServiceDefaults";

/**
 * ============================================================
 * Sea Service — Local DB Adapter (Option 3: Hybrid)
 * ============================================================
 *
 * REQUIREMENTS:
 * - Multiple Sea Service records are allowed (FINAL history)
 * - Exactly ONE active DRAFT can exist at a time (DB unique index)
 *
 * TABLE: sea_service_records
 * - id TEXT PK
 * - ship_name, imo_number (fast listing)
 * - sign_on_date, sign_off_date (fast listing)
 * - payload_json (full payload)
 * - status: DRAFT | FINAL
 *
 * IMPORTANT:
 * - Dates are stored as ISO strings "YYYY-MM-DD" in DB columns.
 * - Payload is stored as JSON (future sync-ready).
 */

/**
 * DB record model used by UI (dashboard + history).
 */
export type SeaServiceRecord = {
  id: string;
  shipName: string | null;
  imoNumber: string | null;
  signOnDate: string | null;
  signOffDate: string | null;
  status: "DRAFT" | "FINAL";
  payload: SeaServicePayload;
  createdAt: string;
  updatedAt: string;
};

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * Generates a stable local id without extra dependencies.
 * (Good enough for offline PK; remote_id will be used later for sync.)
 */
function generateLocalId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `ss_${t}_${r}`;
}

/**
 * Safe JSON parse.
 */
function parsePayloadJson(payloadJson: string): SeaServicePayload {
  try {
    const parsed = JSON.parse(payloadJson) as SeaServicePayload;
    return {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      ...parsed,
      sections: {
        ...DEFAULT_SEA_SERVICE_PAYLOAD.sections,
        ...(parsed as any).sections,
      },
    };
  } catch {
    // Corrupt record fallback (draft-safe)
    return {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
    };
  }
}

/**
 * Ship identity is typically stored inside GENERAL_IDENTITY section.
 * We keep DB columns for fast dashboard listing.
 */
function deriveShipIdentity(payload: SeaServicePayload): {
  shipName: string | null;
  imoNumber: string | null;
} {
  const gi = (payload as any)?.sections?.GENERAL_IDENTITY ?? {};
  const shipName =
    typeof gi?.shipName === "string" && gi.shipName.trim().length > 0
      ? gi.shipName.trim()
      : null;

  const imoNumber =
    typeof gi?.imoNumber === "string" && gi.imoNumber.trim().length > 0
      ? gi.imoNumber.trim()
      : null;

  return { shipName, imoNumber };
}

/**
 * Service period is top-level in payload.
 * DB columns store the ISO strings for fast listing/filtering.
 */
function deriveServicePeriod(payload: SeaServicePayload): {
  signOnDate: string | null;
  signOffDate: string | null;
} {
  const period: any = (payload as any)?.servicePeriod ?? null;

  const signOnDate =
    typeof period?.signOnDate === "string" && period.signOnDate.length > 0
      ? period.signOnDate
      : null;

  const signOffDate =
    typeof period?.signOffDate === "string" && period.signOffDate.length > 0
      ? period.signOffDate
      : null;

  return { signOnDate, signOffDate };
}

/**
 * Convert DB row to record model.
 */
function rowToRecord(row: any): SeaServiceRecord {
  return {
    id: row.id,
    shipName: row.ship_name ?? null,
    imoNumber: row.imo_number ?? null,
    signOnDate: row.sign_on_date ?? null,
    signOffDate: row.sign_off_date ?? null,
    status: row.status,
    payload: parsePayloadJson(row.payload_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ============================================================
 * CREATE DRAFT (EXPLICIT TRANSACTION)
 * ============================================================
 *
 * Called ONLY from StartSeaServiceScreen on:
 *   "Save & Start Sea Service"
 *
 * Guarantees:
 * - Inserts a new row with status='DRAFT'
 * - DB layer enforces only one DRAFT at a time
 */
export function createSeaServiceDraft(args: {
  shipType: string;
  signOnDate: string;
  signOnPort: string;
}): SeaServiceRecord {
  const db = getDatabase();

  const nowIso = new Date().toISOString();
  const id = generateLocalId();

  // Build initial payload
  const payload: SeaServicePayload = {
    ...DEFAULT_SEA_SERVICE_PAYLOAD,
    shipType: args.shipType,
    lastUpdatedAt: Date.now(),
    servicePeriod: {
      ...(DEFAULT_SEA_SERVICE_PAYLOAD as any).servicePeriod,
      signOnDate: args.signOnDate,
      signOnPort: args.signOnPort,
    },
    sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
  } as SeaServicePayload;

  const { shipName, imoNumber } = deriveShipIdentity(payload);
  const { signOnDate, signOffDate } = deriveServicePeriod(payload);

  db.runSync(
    `
    INSERT INTO sea_service_records (
      id,
      ship_name,
      imo_number,
      sign_on_date,
      sign_off_date,
      payload_json,
      status,
      last_updated_at,
      remote_id,
      sync_state,
      created_at,
      updated_at
    )
    VALUES (
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?
    );
  `,
    [
      id,
      shipName,
      imoNumber,
      signOnDate,
      signOffDate,
      JSON.stringify(payload),
      "DRAFT",
      payload.lastUpdatedAt ?? Date.now(),
      null,
      "LOCAL_ONLY",
      nowIso,
      nowIso,
    ]
  );

  // Read back (single source of truth)
  const created = getSeaServiceById(id);
  if (!created) {
    // Extremely rare; but keeps app stable.
    throw new Error("Failed to create Sea Service draft record.");
  }
  return created;
}

/**
 * ============================================================
 * READ — ACTIVE DRAFT (single)
 * ============================================================
 */
export function getActiveSeaServiceDraft(): SeaServiceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT *
    FROM sea_service_records
    WHERE status = 'DRAFT'
    ORDER BY updated_at DESC
    LIMIT 1;
  `
  );

  if (!rows || rows.length === 0) return null;
  return rowToRecord(rows[0]);
}

/**
 * ============================================================
 * READ — FINAL HISTORY (multiple, latest-first)
 * ============================================================
 */
export function getSeaServiceFinalHistory(): SeaServiceRecord[] {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT *
    FROM sea_service_records
    WHERE status = 'FINAL'
    ORDER BY sign_on_date DESC, updated_at DESC;
  `
  );

  return (rows ?? []).map(rowToRecord);
}

/**
 * ============================================================
 * READ — By ID
 * ============================================================
 */
export function getSeaServiceById(id: string): SeaServiceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT *
    FROM sea_service_records
    WHERE id = ?
    LIMIT 1;
  `,
    [id]
  );

  if (!rows || rows.length === 0) return null;
  return rowToRecord(rows[0]);
}

/**
 * ============================================================
 * UPDATE — Upsert active draft payload (DRAFT only)
 * ============================================================
 */
export function upsertSeaServiceDraft(
  recordId: string,
  payload: SeaServicePayload
): void {
  const db = getDatabase();

  const nowIso = new Date().toISOString();
  const lastUpdatedAt =
    typeof payload.lastUpdatedAt === "number" ? payload.lastUpdatedAt : Date.now();

  const payloadToStore: SeaServicePayload = {
    ...payload,
    lastUpdatedAt,
  };

  const payloadJson = JSON.stringify(payloadToStore);
  const { shipName, imoNumber } = deriveShipIdentity(payloadToStore);
  const { signOnDate, signOffDate } = deriveServicePeriod(payloadToStore);

  // Only updates if it is still a DRAFT.
  db.runSync(
    `
    UPDATE sea_service_records
    SET
      ship_name = ?,
      imo_number = ?,
      sign_on_date = ?,
      sign_off_date = ?,
      payload_json = ?,
      last_updated_at = ?,
      sync_state = 'DIRTY',
      updated_at = ?
      WHERE id = ?
      AND status = 'DRAFT';
  `,
    [
      shipName,
      imoNumber,
      signOnDate,
      signOffDate,
      payloadJson,
      lastUpdatedAt,
      nowIso,
      recordId,
    ]
  );
}

/**
 * ============================================================
 * FINALIZE — DRAFT → FINAL
 * ============================================================
 */
export function finalizeSeaService(recordId: string): void {
  const db = getDatabase();

  const nowIso = new Date().toISOString();

  db.runSync(
    `
    UPDATE sea_service_records
    SET
      status = 'FINAL',
      updated_at = ?
    WHERE id = ?
      AND status = 'DRAFT';
  `,
    [nowIso, recordId]
  );
}

/**
 * ============================================================
 * DISCARD — Delete DRAFT only (FINAL immutable)
 * ============================================================
 */
export function discardSeaServiceDraft(recordId: string): void {
  const db = getDatabase();

  db.runSync(
    `
    DELETE FROM sea_service_records
    WHERE id = ?
      AND status = 'DRAFT';
  `,
    [recordId]
  );
}
