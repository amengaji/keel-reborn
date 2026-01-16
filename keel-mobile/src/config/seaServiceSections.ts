//keel-mobile/src/config/seaServiceSections.ts

/**
 * ============================================================
 * Sea Service Sections Configuration
 * ============================================================
 *
 * IMPORTANT:
 * - This file defines the FIXED and OFFICIAL order of sections
 *   for the Sea Service wizard.
 * - The order here MUST NEVER be changed casually.
 * - Ship types will ENABLE or DISABLE sections from this list,
 *   but the sequence remains the same.
 *
 * This ensures:
 * - Consistent cadet experience
 * - Audit-friendly structure
 * - Easy future compliance updates
 *
 * NO UI CODE. NO BUSINESS LOGIC.
 * DATA DEFINITIONS ONLY.
 */

/**
 * Each section represents a major domain area
 * of vessel particulars and safety systems.
 */
export type SeaServiceSectionKey =
  | "GENERAL_IDENTITY"
  | "DIMENSIONS_TONNAGE"
  | "PROPULSION_PERFORMANCE"
  | "AUX_MACHINERY_ELECTRICAL"
  | "DECK_MACHINERY_MANEUVERING"
  | "CARGO_CAPABILITIES"
  | "NAVIGATION_COMMUNICATION"
  | "LIFE_SAVING_APPLIANCES"
  | "FIRE_FIGHTING_APPLIANCES"
  | "POLLUTION_PREVENTION"
  | "INERT_GAS_SYSTEM";

/**
 * Metadata describing a Sea Service section.
 */
export interface SeaServiceSectionDefinition {
  /** Unique section identifier (used internally) */
  key: SeaServiceSectionKey;

  /** Human-readable title shown to cadets */
  title: string;

  /** Short explanation shown below the title */
  description: string;

  /**
   * ============================================================
   * FINALIZATION REQUIREMENT (AUDIT-SAFE)
   * ============================================================
   *
   * PURPOSE:
   * - Explicitly marks whether this section is REQUIRED
   *   for Sea Service finalization.
   *
   * IMPORTANT:
   * - Even if a section is finalizeRequired=true,
   *   it must NOT block finalization when the section is DISABLED
   *   for the current ship type (e.g., IGS on non-tankers).
   *
   * TODAY'S POLICY (LOCKED BY YOU):
   * - ALL enabled sections are mandatory for finalization.
   * - Pollution Prevention is mandatory.
   *
   * FUTURE:
   * - If you ever decide a section is optional, set false here
   *   WITHOUT reordering or removing sections.
   */
  finalizeRequired: boolean;
}

/**
 * ============================================================
 * OFFICIAL SEA SERVICE SECTIONS (ORDERED)
 * ============================================================
 *
 * DO NOT:
 * - Reorder sections
 * - Remove sections
 *
 * You MAY:
 * - Add new sections at the END in future revisions
 *   (with strong justification)
 */
export const SEA_SERVICE_SECTIONS: SeaServiceSectionDefinition[] = [
  {
    key: "GENERAL_IDENTITY",
    title: "General Identity & Registry",
    description:
      "Basic vessel identity, registry, ownership, and classification details.",
    finalizeRequired: true,
  },
  {
    key: "DIMENSIONS_TONNAGE",
    title: "Dimensions & Tonnages",
    description:
      "Principal dimensions, drafts, tonnages, and hull-related particulars.",
    finalizeRequired: true,
  },
  {
    key: "PROPULSION_PERFORMANCE",
    title: "Main Propulsion & Performance",
    description:
      "Main engine details, propulsion arrangement, and vessel performance data.",
    finalizeRequired: true,
  },
  {
    key: "AUX_MACHINERY_ELECTRICAL",
    title: "Auxiliary Machinery & Electrical",
    description:
      "Generators, boilers, electrical systems, and engine room auxiliaries.",
    finalizeRequired: true,
  },
  {
    key: "DECK_MACHINERY_MANEUVERING",
    title: "Deck Machinery & Maneuvering",
    description:
      "Anchoring, mooring, steering gear, and maneuvering equipment.",
    finalizeRequired: true,
  },
  {
    key: "CARGO_CAPABILITIES",
    title: "Cargo Capabilities",
    description:
      "Cargo systems, capacities, cargo handling equipment, and ballast systems.",
    finalizeRequired: true,
  },
  {
    key: "NAVIGATION_COMMUNICATION",
    title: "Navigation & Communication",
    description:
      "Bridge navigation equipment, communication systems, and GMDSS details.",
    finalizeRequired: true,
  },
  {
    key: "LIFE_SAVING_APPLIANCES",
    title: "Life Saving Appliances (LSA)",
    description:
      "Survival craft, personal life-saving equipment, and distress systems.",
    finalizeRequired: true,
  },
  {
    key: "FIRE_FIGHTING_APPLIANCES",
    title: "Fire Fighting Appliances (FFA)",
    description:
      "Fixed and portable fire fighting systems and breathing apparatus.",
    finalizeRequired: true,
  },
  {
    key: "POLLUTION_PREVENTION",
    title: "Pollution Prevention (MARPOL)",
    description:
      "MARPOL Annex I–VI pollution prevention equipment and procedures.",
    finalizeRequired: true,
  },
  {
    key: "INERT_GAS_SYSTEM",
    title: "Inert Gas System (IGS)",
    description:
      "Inert gas generation, distribution, and cargo tank safety systems.",
    finalizeRequired: true,
  },
];

/**
 * ============================================================
 * NOTES FOR FUTURE DEVELOPERS / ADMINS
 * ============================================================
 *
 * - Some ship types will DISABLE sections (e.g., IGS for non-tankers).
 * - Disabled sections must NEVER count toward:
 *   - total sections
 *   - completed sections
 *   - finalization eligibility
 *
 * This rule is enforced in the status/finalization engine
 * (NOT in this config file).
 */
