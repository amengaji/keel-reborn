//keel-mobile/src/sea-service/seaServiceDefaults.ts

/**
 * ============================================================
 * Sea Service Default Payload (FOUNDATION)
 * ============================================================
 *
 * PURPOSE:
 * - Define a SAFE, COMPLETE default structure for Sea Service
 * - Prevent undefined access crashes
 * - Enable draft-first, sign-on → sign-off lifecycle
 *
 * IMPORTANT:
 * - NO UI code
 * - NO database code
 * - NO business rules
 *
 * This file is the SINGLE SOURCE OF TRUTH
 * for Sea Service payload shape.
 */

/**
 * ============================================================
 * Service Period (Sign-On / Sign-Off)
 * ============================================================
 *
 * Maritime rules:
 * - Sign-on is mandatory to start service
 * - Sign-off happens much later
 * - Drafts MUST support null sign-off
 */
export interface SeaServicePeriod {
  /** Date cadet joined the vessel (YYYY-MM-DD) */
  signOnDate: Date | null;

  /** Port where cadet joined */
  signOnPort: string | null;

  /** Date cadet signed off (nullable until completion) */
  signOffDate: Date | null;

  /** Port where cadet signed off (nullable until completion) */
  signOffPort: string | null;
}

/**
 * ============================================================
 * Top-level Sea Service payload
 * ============================================================
 *
 * This object is:
 * - Stored as JSON in SQLite
 * - Draft-safe
 * - Future sync-ready
 */
export interface SeaServicePayload {
  /** Ship type selected once per service */
  shipType: string | null;

  /** Sign-on / sign-off lifecycle */
  servicePeriod: SeaServicePeriod;

  /** Timestamp of last update (epoch ms) */
  lastUpdatedAt: number | null;

    /**
   * Section completion tracking
   * Used for finalize gating and UX indicators
   */
  sectionStatus: SeaServiceSectionStatusMap;

  /** Section-wise technical data */
  sections: {
    GENERAL_IDENTITY: Record<string, any>;
    DIMENSIONS_TONNAGE: Record<string, any>;
    PROPULSION_PERFORMANCE: Record<string, any>;
    AUX_MACHINERY_ELECTRICAL: Record<string, any>;
    DECK_MACHINERY_MANEUVERING: Record<string, any>;
    CARGO_CAPABILITIES: Record<string, any>;
    NAVIGATION_COMMUNICATION: Record<string, any>;
    LIFE_SAVING_APPLIANCES: Record<string, any>;
    FIRE_FIGHTING_APPLIANCES: Record<string, any>;
    POLLUTION_PREVENTION: Record<string, any>;
    INERT_GAS_SYSTEM: Record<string, any>;
  };
}

/**
 * Section completion status
 * - INCOMPLETE: not yet saved
 * - COMPLETE: saved at least once
 */
export type SeaServiceSectionStatus =
  | "INCOMPLETE"
  | "COMPLETE";


  /**
 * Typed section keys (prevents typos and missing keys)
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
 * Section completion map (strict)
 */
export type SeaServiceSectionStatusMap = Record<
  SeaServiceSectionKey,
  SeaServiceSectionStatus
>;


/**
 * ============================================================
 * DEFAULT EMPTY PAYLOAD (DRAFT-SAFE)
 * ============================================================
 *
 * Used when:
 * - Starting a new Sea Service
 * - Creating a draft
 * - Recovering from corrupted storage
 *
 * GUARANTEE:
 * - No property in SeaServicePayload is ever undefined
 */
export const DEFAULT_SEA_SERVICE_PAYLOAD: SeaServicePayload = {
  shipType: null,

  /**
   * Service period ALWAYS exists.
   * Sign-off fields remain null until cadet signs off.
   */
  servicePeriod: {
    signOnDate: null,
    signOnPort: null,
    signOffDate: null,
    signOffPort: null,
  },

  lastUpdatedAt: null,

    sectionStatus: {
    GENERAL_IDENTITY: "INCOMPLETE",
    DIMENSIONS_TONNAGE: "INCOMPLETE",
    PROPULSION_PERFORMANCE: "INCOMPLETE",
    AUX_MACHINERY_ELECTRICAL: "INCOMPLETE",
    DECK_MACHINERY_MANEUVERING: "INCOMPLETE",
    CARGO_CAPABILITIES: "INCOMPLETE",
    NAVIGATION_COMMUNICATION: "INCOMPLETE",
    LIFE_SAVING_APPLIANCES: "INCOMPLETE",
    FIRE_FIGHTING_APPLIANCES: "INCOMPLETE",
    POLLUTION_PREVENTION: "INCOMPLETE",
    INERT_GAS_SYSTEM: "INCOMPLETE",
  },

  sections: {
    GENERAL_IDENTITY: {},
    DIMENSIONS_TONNAGE: {},
    PROPULSION_PERFORMANCE: {},
    AUX_MACHINERY_ELECTRICAL: {},
    DECK_MACHINERY_MANEUVERING: {},
    CARGO_CAPABILITIES: {},
    NAVIGATION_COMMUNICATION: {},
    LIFE_SAVING_APPLIANCES: {},
    FIRE_FIGHTING_APPLIANCES: {},
    POLLUTION_PREVENTION: {},
    INERT_GAS_SYSTEM: {},
  },
};

/**
 * ============================================================
 * NOTES
 * ============================================================
 *
 * - This structure is intentionally verbose.
 * - Backward-compatible with existing SQLite records.
 * - Future fields can be added safely without migration.
 * - All lifecycle logic lives OUTSIDE this file.
 */
