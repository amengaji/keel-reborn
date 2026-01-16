export type TaskCatalogItem = {
  taskKey: string;
  title: string;
  description: string;
  guidance: string;
};

export const TASK_CATALOG: Record<string, TaskCatalogItem> = {
  "DC.NAV.01": {
    taskKey: "DC.NAV.01",
    title: "Identify and explain use of nautical charts",
    description:
      "Identify chart symbols, scale, datum and demonstrate chart corrections.",
    guidance:
      "Show corrected charts onboard and explain chart symbols to the officer.",
  },

  "DC.NAV.02": {
    taskKey: "DC.NAV.02",
    title: "Assist in preparation of passage plan",
    description:
      "Assist in berth-to-berth passage planning including appraisal and monitoring.",
    guidance:
      "Participate in passage planning discussion with the officer.",
  },
};
