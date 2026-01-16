//keel-mobile/src/sea-service/seaServiceStatus.ts

/**
 * ============================================================
 * Sea Service — Status & Finalization Authority
 * ============================================================
 *
 * SINGLE SOURCE OF TRUTH FOR:
 * - Section status calculation
 * - Dashboard summaries
 * - Finalization eligibility
 *
 * CORE PRINCIPLES (LOCKED):
 * - Boolean fields are VALID when true OR false
 * - Optional fields MUST NOT block completion
 * - Conditional fields apply ONLY when their gate is ON
 * - Group-level NO = NOT APPLICABLE (PSC rule)
 * - Option A finalization: ALL sections must be COMPLETED
 */

import {
  SEA_SERVICE_SECTIONS,
  SeaServiceSectionKey,
} from "../config/seaServiceSections";
import { SeaServicePayload } from "./seaServiceDefaults";

/**
 * ============================================================
 * SECTION STATUS TYPES
 * ============================================================
 */
export type SeaServiceSectionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

/**
 * ============================================================
 * GENERIC VALUE CHECK
 * ============================================================
 *
 * IMPORTANT RULE:
 * - Boolean FALSE is a VALID ANSWER
 * - Only null / undefined count as missing
 */
function hasValue(v: any): boolean {
  if (v === null || v === undefined) return false;

  // ✅ Explicit boolean answer is valid (true OR false)
  if (typeof v === "boolean") return true;

  if (typeof v === "number") return true;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;

  return false;
}

/**
 * ============================================================
 * DATE VALIDATION (ISO SAFE)
 * ============================================================
 */
function isValidDateValue(value: unknown): boolean {
  if (!value) return false;

  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }

  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  return false;
}

/**
 * ============================================================
 * HELPER — CHECK IF SECTION IS ENABLED FOR SHIP TYPE
 * ============================================================
 *
 * RULE:
 * - Only INERT_GAS_SYSTEM is ship-type dependent
 * - All other sections are always enabled
 */
function isSectionEnabled(
  sectionKey: SeaServiceSectionKey,
  shipType?: string
): boolean {
  if (sectionKey !== "INERT_GAS_SYSTEM") return true;

  const normalizedShipType = String(shipType ?? "")
    .toUpperCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  return (
    normalizedShipType === "TANKER" ||
    normalizedShipType === "OIL_TANKER" ||
    normalizedShipType === "PRODUCT_TANKER" ||
    normalizedShipType === "CHEMICAL_TANKER"
  );
}


/**
 * ============================================================
 * SERVICE PERIOD COMPLETION
 * ============================================================
 *
 * RULE:
 * - Sign-on AND sign-off are mandatory
 */
export function isServicePeriodComplete(
  servicePeriod:
    | {
        signOnDate: string | Date | null;
        signOnPort: string | null;
        signOffDate: string | Date | null;
        signOffPort: string | null;
      }
    | undefined
): boolean {
  if (!servicePeriod) return false;

  return (
    isValidDateValue(servicePeriod.signOnDate) &&
    typeof servicePeriod.signOnPort === "string" &&
    servicePeriod.signOnPort.trim().length > 0 &&
    isValidDateValue(servicePeriod.signOffDate) &&
    typeof servicePeriod.signOffPort === "string" &&
    servicePeriod.signOffPort.trim().length > 0
  );
}

/**
 * ============================================================
 * HELPER — DETECT DISABLED GROUPS (GATE = NO)
 * ============================================================
 *
 * Any key of the form:
 *   __groupEnabled__<GROUP_KEY> === false
 * means the entire group is NOT APPLICABLE
 * and its fields MUST be ignored for completion.
 */
function getDisabledGroupKeys(sectionData: Record<string, any>): Set<string> {
  const disabled = new Set<string>();

  Object.entries(sectionData).forEach(([key, value]) => {
    if (
      key.startsWith("__groupEnabled__") &&
      value === false
    ) {
      const groupKey = key.replace("__groupEnabled__", "");
      disabled.add(groupKey);
    }
  });

  return disabled;
}

/**
 * ============================================================
 * SECTION STATUS ENGINE (GATE-AWARE)
 * ============================================================
 */
export function getSeaServiceSectionStatus(
  sectionKey: SeaServiceSectionKey,
  sectionData: any,
  shipType?: string
): SeaServiceSectionStatus {
  if (!sectionData || typeof sectionData !== "object") {
    return "NOT_STARTED";
  }

/**
 * ========================================================
 * STARTED / NOT STARTED RULE
 * ========================================================
 *
 * Gate-driven sections (e.g. Cargo Capabilities)
 * are considered STARTED as soon as the section exists.
 */
if (sectionKey !== "CARGO_CAPABILITIES") {
  const hasAnyData = Object.values(sectionData).some(hasValue);
  if (!hasAnyData) {
    return "NOT_STARTED";
  }
}



  switch (sectionKey) {
    case "LIFE_SAVING_APPLIANCES":
      return sectionData.lifeboatsAvailable ||
        sectionData.lifeRaftsAvailable ||
        sectionData.lifeJacketsAvailable
        ? "COMPLETED"
        : "IN_PROGRESS";

    case "FIRE_FIGHTING_APPLIANCES":
      return sectionData.engineRoomFixedAvailable ||
        sectionData.portableExtinguishersAvailable
        ? "COMPLETED"
        : "IN_PROGRESS";

        /**
 * ========================================================
 * POLLUTION PREVENTION (MARPOL I–VI) — FINAL LOGIC
 * ========================================================
 *
 * RULE:
 * - All mandatory gates are enforced at SAVE time
 * - If the section has ANY data, it is COMPLETED
 * - Optional notes NEVER affect completion
 */
case "POLLUTION_PREVENTION": {
  // If nothing saved at all → not started
  const hasAnyData = Object.values(sectionData).some(hasValue);
  if (!hasAnyData) {
    return "NOT_STARTED";
  }

  // Save-time validation guarantees correctness
  return "COMPLETED";
}


    /**
     * ========================================================
     * INERT GAS SYSTEM (IGS) — FINAL LOGIC (UNCHANGED)
     * ========================================================
     */
    case "INERT_GAS_SYSTEM": {
      const normalizedShipType = shipType
        ? shipType.toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_")
        : "";

      const isTanker =
        normalizedShipType === "TANKER" ||
        normalizedShipType === "OIL_TANKER" ||
        normalizedShipType === "PRODUCT_TANKER" ||
        normalizedShipType === "CHEMICAL_TANKER";

      // CASE 1 — IGS NOT FITTED (VALID FOR NON-TANKERS)
      if (
        sectionData.igsFitted === false &&
        !isTanker &&
        typeof sectionData.igsNotFittedReason === "string" &&
        sectionData.igsNotFittedReason.trim().length > 0
      ) {
        return "COMPLETED";
      }

      // CASE 2 — IGS FITTED
      if (sectionData.igsFitted === true) {
        const hasCore =
          hasValue(sectionData.igsSourceType) &&
          sectionData.scrubberAvailable !== undefined &&
          sectionData.blowerAvailable !== undefined &&
          sectionData.deckSealAvailable !== undefined &&
          sectionData.oxygenAnalyzerAvailable !== undefined &&
          sectionData.igPressureAlarmAvailable !== undefined;

        const requiresBlowerCount = sectionData.blowerAvailable === true;
        const requiresDeckSealType = sectionData.deckSealAvailable === true;

        const hasBlowerDetails =
          !requiresBlowerCount || hasValue(sectionData.blowerCount);

        const hasDeckSealDetails =
          !requiresDeckSealType || hasValue(sectionData.deckSealType);

        if (hasCore && hasBlowerDetails && hasDeckSealDetails) {
          return "COMPLETED";
        }

        return "IN_PROGRESS";
      }

      return "IN_PROGRESS";
    }

    /**
 * ========================================================
 * CARGO CAPABILITIES — FITTED YES REQUIRES ≥1 SUBTYPE YES
 * ========================================================
 */
case "CARGO_CAPABILITIES": {
  if (!sectionData || typeof sectionData !== "object") {
    return "COMPLETED";
  }

  /**
   * Helper: check if at least one boolean field is true
   */
  const hasAnyYes = (keys: string[]) =>
    keys.some((k) => sectionData[k] === true);

  /**
   * ---------------- STRIPPING PUMPS ----------------
   */
  if (sectionData.strippingPumpFitted === true) {
    const strippingSubtypes = [
      "strippingPumpEductor",
      "strippingPumpCentrifugal",
      "strippingPumpReciprocating",
      "strippingPumpPortable",
      "strippingPumpIntegrated",
      "strippingPumpOther",
    ];

    if (!hasAnyYes(strippingSubtypes)) {
      return "IN_PROGRESS";
    }
  }

  /**
   * ---------------- CARGO PUMPS ----------------
   */
  if (sectionData.cargoPumpsFitted === true) {
    const cargoPumpSubtypes = [
      "cargoPumpCentrifugal",
      "cargoPumpReciprocating",
      "cargoPumpEductor",
      "cargoPumpOther",
    ];

    if (!hasAnyYes(cargoPumpSubtypes)) {
      return "IN_PROGRESS";
    }
  }



return "COMPLETED";

}


    /**
     * ========================================================
     * DEFAULT SECTION RULE (GATE-AWARE)
     * ========================================================
     */
    default: {
      const disabledGroups = getDisabledGroupKeys(sectionData);

      /**
       * Filter out:
       * - Boolean values (handled separately)
       * - Any fields belonging to disabled groups
       */
const relevantEntries = Object.entries(sectionData).filter(
  ([key, value]) => {
    // Booleans are always valid answers
    if (typeof value === "boolean") return false;

    // Ignore all gate keys
    if (key.startsWith("__groupEnabled__")) return false;
    if (key.startsWith("__") && key.endsWith("__")) return false;

    // Ignore fields belonging to disabled groups
    for (const groupKey of disabledGroups) {
      if (key.startsWith(groupKey)) {
        return false;
      }
    }

    /**
     * FEATURE-LEVEL GATES (PSC RULE)
     * If a fitted gate is NO, all dependent fields are NOT APPLICABLE
     */
    if (
      sectionData.__strippingPumpFitted__ === false &&
      key.startsWith("strippingPump")
    ) {
      return false;
    }

    if (
      sectionData.__cargoPumpsFitted__ === false &&
      key.startsWith("cargoPump")
    ) {
      return false;
    }

    return true;
  }
);


      if (relevantEntries.length === 0) {
        return "COMPLETED";
      }

      const allFilled = relevantEntries.every(([, v]) => hasValue(v));
      return allFilled ? "COMPLETED" : "IN_PROGRESS";
    }
  }
}

/**
 * ============================================================
 * DASHBOARD SUMMARY
 * ============================================================
 */
export function getSeaServiceSummary(
  sectionsData: Record<string, any> | undefined,
  shipType?: string
) {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  SEA_SERVICE_SECTIONS.forEach((section) => {
    const data = sectionsData?.[section.key];
    const status = getSeaServiceSectionStatus(
      section.key,
      data,
      shipType
    );

    if (status === "COMPLETED") completed++;
    else if (status === "IN_PROGRESS") inProgress++;
    else notStarted++;
  });

  return {
    totalSections: SEA_SERVICE_SECTIONS.length,
    completedSections: completed,
    inProgressSections: inProgress,
    notStartedSections: notStarted,
  };
}

/**
 * ============================================================
 * FINALIZATION AUTHORITY (OPTION A)
 * ============================================================
 */
export function canFinalizeSeaService(
  payload: SeaServicePayload,
  shipType?: string
): boolean {
  if (!payload?.sections) return false;

  if (!isServicePeriodComplete(payload.servicePeriod)) {
    return false;
  }

  /**
   * ============================================================
   * FINALIZATION RULE (PATCHED – PSC SAFE)
   * ============================================================
   *
   * - Only sections that are:
   *   a) finalizeRequired === true
   *   b) enabled for the ship type
   *   MUST be COMPLETED
   *
   * - Disabled sections (e.g. IGS on non-tankers)
   *   NEVER block finalization
   */
  for (const section of SEA_SERVICE_SECTIONS) {
    if (!section.finalizeRequired) continue;

    const enabled = isSectionEnabled(section.key, shipType);
    if (!enabled) continue;

    const data = payload.sections[section.key];
    const status = getSeaServiceSectionStatus(
      section.key,
      data,
      shipType
    );

    if (status !== "COMPLETED") {
      return false;
    }
  }

  return true;

}
