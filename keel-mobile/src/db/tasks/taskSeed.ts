// keel-mobile/src/db/taskSeed.ts

/**
 * ============================================================
 * TASK SEED DATA (TEMPORARY — EXCEL-LIKE)
 * ============================================================
 *
 * PURPOSE:
 * - Populate SQLite so Task Details screen shows real data
 * - Mimics how Excel import will look later
 *
 * SAFE TO DELETE LATER:
 * - Yes
 * - No UI depends on this file directly
 */

export type TaskSeedItem = {
  taskKey: string;           // DC.NAV.01 / ER.MECH.02
  taskTitle: string;
  description: string;
  guidance: string;
  mandatory: boolean;
  stream: "DC" | "EC" | "DR" | "ER";
  section: string;
  shipTypes: string[];       // ["ALL"] or ["BULK", "TANKER"]
};

export const TASK_SEED: TaskSeedItem[] = [
  {
    taskKey: "DC.NAV.01",
    taskTitle: "Identify and explain use of nautical charts",
    description:
      "Identify chart symbols, scale, datum, and demonstrate correction of charts using Notices to Mariners.",
    guidance:
      "Show corrected paper or ECDIS charts onboard and explain symbol usage to the officer.",
    mandatory: true,
    stream: "DC",
    section: "NAV",
    shipTypes: ["ALL"],
  },
  {
    taskKey: "DC.NAV.02",
    taskTitle: "Assist in preparation of passage plan",
    description:
      "Assist the officer in preparing berth-to-berth passage plan including appraisal, planning, execution, and monitoring.",
    guidance:
      "Participate in passage planning meeting and explain hazards identified.",
    mandatory: true,
    stream: "DC",
    section: "NAV",
    shipTypes: ["ALL"],
  },
];
