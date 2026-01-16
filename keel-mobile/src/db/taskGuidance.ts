//keel-mobile/src/db/taskGuidance.ts

import { getDatabase } from "./database";

/**
 * ============================================================
 * Task Guidance — Local DB Adapter (READ-ONLY)
 * ============================================================
 *
 * PURPOSE:
 * - Provide structured training guidance for each task
 * - Guidance is TEMPLATE data (not cadet data)
 * - Offline-first, inspector-safe
 *
 * IMPORTANT RULES:
 * - Cadets NEVER modify guidance
 * - This adapter exposes READ APIs only
 * - Seeded once, extendable later (admin / Excel)
 */

/**
 * ============================================================
 * Task Guidance Record Shape
 * ============================================================
 *
 * NOTE:
 * - All guidance fields are plain TEXT for Phase 1
 * - Bullet points are represented using line breaks
 */
export type TaskGuidanceRecord = {
  id: string;
  taskKey: string;

  stream: "deck" | "engine" | "rating";
  section: string;

  purpose: string;
  steps: string;
  commonMistakes: string | null;
  evidenceExpected: string | null;
  officerExpectation: string | null;

  createdAt: string;
  updatedAt: string;
};

/**
 * ============================================================
 * SEED GUIDANCE (PHASE 1 — SAMPLE)
 * ============================================================
 *
 * These are COPYRIGHT-SAFE, REPHRASED examples
 * derived from standard TRB intent (not copy-paste).
 *
 * Later:
 * - Expanded to full Deck / Engine / Rating sets
 * - Company-specific tasks can be appended
 */
const SEED_TASK_GUIDANCE: Omit<
  TaskGuidanceRecord,
  "createdAt" | "updatedAt"
>[] = [
  {
    id: "GUIDE_D_1",
    taskKey: "D.1",

    stream: "deck",
    section: "Navigation & Bridge",

    purpose:
      "To ensure the cadet understands the layout of the bridge and the location of essential navigational equipment used during watchkeeping.",

    steps:
      "• Identify the bridge layout and workstations\n" +
      "• Point out primary navigation equipment (gyro, radar, ECDIS)\n" +
      "• Explain the basic purpose of each item",

    commonMistakes:
      "• Naming equipment without understanding its function\n" +
      "• Confusing standby instruments with primary equipment",

    evidenceExpected:
      "• Photograph of bridge layout with equipment labelled\n" +
      "• Officer remarks confirming explanation was satisfactory",

    officerExpectation:
      "Officer should be satisfied that the cadet can correctly identify and explain bridge equipment relevant to safe navigation.",
  },
  {
    id: "GUIDE_D_2",
    taskKey: "D.2",

    stream: "deck",
    section: "Navigation & Bridge",

    purpose:
      "To verify that the cadet understands the main components of a marine radar and their role in collision avoidance.",

    steps:
      "• Identify radar display controls\n" +
      "• Explain gain, sea clutter, and rain clutter\n" +
      "• Demonstrate basic target acquisition",

    commonMistakes:
      "• Explaining theory without demonstration\n" +
      "• Incorrect use of gain and clutter controls",

    evidenceExpected:
      "• Photo or short video demonstrating radar adjustments\n" +
      "• Officer confirmation of practical understanding",

    officerExpectation:
      "Officer should ensure the cadet can both explain and demonstrate radar operation during watch conditions.",
  },
];

/**
 * ============================================================
 * ensureSeedTaskGuidanceExists
 * ============================================================
 *
 * Inserts seed guidance ONLY if table is empty.
 *
 * WHY:
 * - Prevents duplicate rows
 * - Allows future extension without overwrite
 */
export function ensureSeedTaskGuidanceExists(): void {
  const db = getDatabase();

  const rows = db.getAllSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM task_guidance;`
  );

  const count = rows?.[0]?.count ?? 0;
  if (count > 0) return;

  const nowIso = new Date().toISOString();

  for (const g of SEED_TASK_GUIDANCE) {
    db.runSync(
      `
      INSERT INTO task_guidance (
        id,
        task_key,
        stream,
        section,
        purpose,
        steps,
        common_mistakes,
        evidence_expected,
        officer_expectation,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      );
      `,
      [
        g.id,
        g.taskKey,
        g.stream,
        g.section,
        g.purpose,
        g.steps,
        g.commonMistakes,
        g.evidenceExpected,
        g.officerExpectation,
        nowIso,
        nowIso,
      ]
    );
  }
}

/**
 * ============================================================
 * getTaskGuidanceByKey
 * ============================================================
 *
 * Fetch guidance for a given taskKey.
 * Returns null if guidance is not available.
 */
export function getTaskGuidanceByKey(
  taskKey: string
): TaskGuidanceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<TaskGuidanceRecord>(
    `
    SELECT
      id,
      task_key AS taskKey,
      stream,
      section,
      purpose,
      steps,
      common_mistakes AS commonMistakes,
      evidence_expected AS evidenceExpected,
      officer_expectation AS officerExpectation,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM task_guidance
    WHERE task_key = ?
    LIMIT 1;
    `,
    [taskKey]
  );

  return rows?.[0] ?? null;
}
