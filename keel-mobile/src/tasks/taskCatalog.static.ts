//keel-mobile/src/tasks/taskCatalog.static.ts

/**
 * ============================================================
 * STATIC TASK CATALOG (READ-ONLY, INSPECTOR-SAFE)
 * ============================================================
 *
 * PURPOSE:
 * - Acts as the SINGLE SOURCE OF TRUTH for task content
 * - Replaces hard-coded titles/descriptions in screens
 * - Mirrors future Excel-import structure exactly
 *
 * IMPORTANT RULES:
 * - NO runtime mutation
 * - NO SQLite dependency
 * - NO business logic
 * - READ-ONLY for cadets
 *
 * ARCHITECTURAL DECISION (LOCKED):
 * - SQLite stores STATUS ONLY
 * - Task content lives here (or Excel later)
 *
 * KEY FORMAT (FINAL):
 * - DC.<SECTION>.<NUMBER>  → Deck Cadet
 * - EC.<SECTION>.<NUMBER>  → Engine Cadet
 * - DR.<SECTION>.<NUMBER>  → Deck Rating
 * - ER.<SECTION>.<NUMBER>  → Engine Rating
 *
 * EXAMPLE:
 * - DC.NAV.001
 * - DC.WATCH.004
 */

/**
 * ============================================================
 * Task Catalog Types
 * ============================================================
 */

export type StaticTaskCatalogEntry = {
  /** Final immutable task key (audit-visible) */
  taskKey: string;

  /** Short task title (list + header use) */
  title: string;

  /** What the cadet is expected to do (summary) */
  description: string;

  /**
   * Short guidance blurb
   * (Detailed guidance still lives in SQLite dialog for now)
   */
  guidanceSummary: string;

  /** Section key (NAV, WATCH, etc.) */
  section: string;

  /** Stream classification */
  stream: "DC" | "EC" | "DR" | "ER";
};

/**
 * ============================================================
 * STATIC TASK CATALOG (DECK CADET — SAMPLE)
 * ============================================================
 *
 * NOTE:
 * - This is intentionally SMALL for now
 * - We will expand section-by-section
 * - Structure mirrors Excel rows exactly
 */

export const STATIC_TASK_CATALOG: Record<
  string,
  StaticTaskCatalogEntry
> = {
  /**
   * ------------------------------------------------------------
   * Navigation & Passage Planning
   * ------------------------------------------------------------
   */

  "DC.NAV.001": {
    taskKey: "DC.NAV.001",
    stream: "DC",
    section: "NAV",
    title: "Identify and explain use of nautical charts",
    description:
      "Identify different types of nautical charts carried onboard and explain their correct use for safe navigation.",
    guidanceSummary:
      "Cadet must demonstrate familiarity with chart symbols, corrections, and practical onboard usage.",
  },

  "DC.NAV.002": {
    taskKey: "DC.NAV.002",
    stream: "DC",
    section: "NAV",
    title: "Assist in preparation of passage plan",
    description:
      "Assist the navigating officer in preparing a berth-to-berth passage plan in accordance with company and SOLAS requirements.",
    guidanceSummary:
      "Focus on appraisal, planning, execution, and monitoring stages of passage planning.",
  },

  /**
   * ------------------------------------------------------------
   * Bridge Watchkeeping
   * ------------------------------------------------------------
   */

  "DC.WATCH.001": {
    taskKey: "DC.WATCH.001",
    stream: "DC",
    section: "WATCH",
    title: "Observe bridge watchkeeping procedures",
    description:
      "Observe and understand standard bridge watchkeeping procedures during sea and port watches.",
    guidanceSummary:
      "Cadet should understand lookout duties, reporting protocols, and COLREG compliance.",
  },
};

/**
 * ============================================================
 * SAFE ACCESSOR (DEFENSIVE)
 * ============================================================
 *
 * WHY:
 * - Prevents undefined crashes
 * - Makes UI logic explicit and audit-safe
 */

export function getStaticTaskByKey(taskKey: string) {
  return STATIC_TASK_CATALOG[taskKey] ?? null;
}
