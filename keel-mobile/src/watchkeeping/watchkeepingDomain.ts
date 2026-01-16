//keel-mobile/src/watchkeeping/watchkeepingDomain.ts

/**
 * ============================================================
 * Watchkeeping — Domain Contract (STCW-Oriented)
 * ============================================================
 *
 * PURPOSE:
 * - Define what a "Watch" officially means in KEEL
 * - Support sea, port, cargo, and anchor watches
 * - Allow cross-department training watches
 * - Separate "what the cadet logs" from
 *   "what the system validates"
 *
 * IMPORTANT:
 * - NO UI code
 * - NO database code
 * - NO backend logic
 *
 * This file is the single rulebook for watchkeeping.
 */

/* ============================================================
 * Core Enumerations
 * ============================================================ */

/**
 * Physical ship state at the time of the watch.
 */
export type ShipState =
  | "AT_SEA"
  | "IN_PORT"
  | "AT_ANCHOR";

/**
 * Operational watch category.
 * This is what the cadet selects.
 */
export type WatchType =
  | "SEA_WATCH"
  | "PORT_WATCH"
  | "CARGO_WATCH"
  | "ANCHOR_WATCH";

/**
 * Location / department where the watch was stood.
 * Used for cross-department training recognition.
 */
export type WatchLocation =
  | "BRIDGE"
  | "ENGINE_ROOM"
  | "CARGO_DECK";

/**
 * Cadet primary discipline.
 * IMPORTANT:
 * This does NOT restrict what can be logged.
 */
export type CadetDiscipline =
  | "DECK"
  | "ENGINE";

/* ============================================================
 * Watch Entry Structure
 * ============================================================ */

/**
 * Represents a single watchkeeping record.
 */
export interface WatchEntry {
  /** Unique identifier (local DB / backend later) */
  id: string;

  /** Start time of the watch */
  startTime: Date;

  /** End time of the watch */
  endTime: Date;

  /** Operational watch category */
  watchType: WatchType;

  /** Physical ship state */
  shipState: ShipState;

  /** Location where watch was stood */
  location: WatchLocation;

  /**
   * Whether cargo operations were in progress.
   * Relevant mainly for tankers / gas carriers.
   */
  cargoOps: boolean;

  /**
   * Cadet's primary discipline at the time.
   * Used for validation, not for restriction.
   */
  cadetDiscipline: CadetDiscipline;

  /** Creation timestamp */
  createdAt: Date;

  /** Optional remarks */
  remarks?: string;
}

/* ============================================================
 * Compliance-Oriented Status
 * ============================================================ */

/**
 * High-level watchkeeping status.
 * Used by Home dashboard (read-only).
 */
export type WatchkeepingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS";

/**
 * NOTE:
 * There is intentionally NO "COMPLETED" status.
 *
 * Watchkeeping is continuous and assessed
 * over accumulated time, not single entries.
 */

/* ============================================================
 * Safe Helper Functions (PURE)
 * ============================================================ */

/**
 * Returns true if at least one watch entry exists.
 */
export function hasAnyWatchEntries(
  watches: WatchEntry[] | undefined | null
): boolean {
  return Array.isArray(watches) && watches.length > 0;
}

/**
 * Returns the most recent watch end time.
 * Useful for inspector recency checks.
 */
export function getLastWatchDate(
  watches: WatchEntry[] | undefined | null
): Date | null {
  if (!Array.isArray(watches) || watches.length === 0) {
    return null;
  }

  return watches
    .map((w) => w.endTime)
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

/**
 * Derives a conservative watchkeeping status.
 */
export function getWatchkeepingStatus(
  watches: WatchEntry[] | undefined | null
): WatchkeepingStatus {
  if (!hasAnyWatchEntries(watches)) {
    return "NOT_STARTED";
  }

  return "IN_PROGRESS";
}

/* ============================================================
 * VALIDATION PHILOSOPHY (IMPORTANT NOTES)
 * ============================================================ *
 *
 * - A cadet may log ANY watch type.
 * - The system NEVER blocks logging based on discipline.
 * - Validity (what counts, how much counts) is decided later.
 *
 * Examples:
 * - Deck cadet in Engine Room → allowed (training)
 * - Engine cadet on Bridge → allowed (training)
 * - Cargo watch on tanker → likely valid
 * - Cargo watch on container ship → may not count
 *
 * These decisions will live in a future
 * watchkeepingValidation.ts file.
 *
 * This contract only defines structure and intent.
 */
