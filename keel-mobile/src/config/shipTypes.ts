//keel-mobile/src/config/shipTypes.ts

/**
 * ============================================================
 * Ship Types Configuration
 * ============================================================
 *
 * IMPORTANT DESIGN RULES:
 * - Ship types are DATA, not enums or hardcoded logic.
 * - Each ship type declares which Sea Service sections apply.
 * - UI and wizard logic MUST rely only on this configuration.
 *
 * This design allows:
 * - Easy addition of new ship types
 * - Future Excel-based admin imports
 * - Zero refactor when fleet profiles change
 *
 * NO UI CODE. NO BUSINESS LOGIC.
 */

/**
 * Import section keys to ensure type safety.
 */
import { SeaServiceSectionKey } from "./seaServiceSections";

/**
 * Definition of a ship type.
 */
export interface ShipTypeDefinition {
  /** Unique internal code (used in DB & payloads) */
  code: string;

  /** Human-readable name shown to cadets */
  label: string;

  /** Sea Service sections applicable to this ship type */
  enabledSections: SeaServiceSectionKey[];
}

/**
 * ============================================================
 * OFFICIAL SHIP TYPES
 * ============================================================
 *
 * NOTE:
 * - You may ADD new ship types at the end of this list.
 * - Do NOT modify existing codes once used in production.
 */
export const SHIP_TYPES: ShipTypeDefinition[] = [
  {
    code: "GENERAL_CARGO",
    label: "General Cargo",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "BULK_CARRIER",
    label: "Bulk Carrier",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "CAR_CARRIER",
    label: "Car Carrier",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "CONTAINER",
    label: "Container",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "RO_RO",
    label: "Ro-Ro",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "PASSENGER",
    label: "Passenger",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
  {
    code: "OIL_TANKER",
    label: "Oil Tanker",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
      "INERT_GAS_SYSTEM",

    ],
  },
  {
    code: "CHEMICAL_TANKER",
    label: "Chemical Tanker",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
      "INERT_GAS_SYSTEM",
    ],
  },
  {
    code: "GAS_TANKER",
    label: "Gas Tanker",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "CARGO_CAPABILITIES",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
      "INERT_GAS_SYSTEM",
    ],
  },
  {
    code: "AHTS",
    label: "Anchor Handling Tug Supply (AHTS)",
    enabledSections: [
      "GENERAL_IDENTITY",
      "DIMENSIONS_TONNAGE",
      "PROPULSION_PERFORMANCE",
      "AUX_MACHINERY_ELECTRICAL",
      "DECK_MACHINERY_MANEUVERING",
      "NAVIGATION_COMMUNICATION",
      "LIFE_SAVING_APPLIANCES",
      "FIRE_FIGHTING_APPLIANCES",
      "POLLUTION_PREVENTION",
    ],
  },
];

/**
 * ============================================================
 * FUTURE NOTES
 * ============================================================
 *
 * - Admin Excel imports will eventually generate or update
 *   this structure from backend configuration.
 *
 * - Cadet apps will receive ship types via sync and cache
 *   them locally for offline usage.
 *
 * - NEVER gate logic directly by ship code in UI.
 *   Always rely on enabledSections instead.
 */
