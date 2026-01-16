//keel-mobile/src/config/cargoProfiles.ts

/**
 * ============================================================
 * Cargo Profiles Configuration (Expanded)
 * ============================================================
 *
 * PURPOSE:
 * - Define cargo, load line, and capacity characteristics
 *   per ship type
 * - Drive UI rendering dynamically
 * - Act as SINGLE SOURCE OF TRUTH
 *
 * DESIGN PRINCIPLES:
 * - CONFIG ONLY (no UI, no logic)
 * - Explicit, verbose, audit-friendly
 * - Admin / Excel extensible in future
 * - Ship-type aware but schema-stable
 */

/**
 * ------------------------------------------------------------
 * PROFILE KEYS
 * ------------------------------------------------------------
 */
export type CargoProfileKey =
  | "BULK"
  | "LIQUID_TANKER"
  | "GAS_TANKER"
  | "CONTAINER"
  | "CAR_CARRIER"
  | "RO_RO"
  | "GENERAL"
  | "PASSENGER";

/**
 * ------------------------------------------------------------
 * UI CONTROL TYPES (HINTS ONLY)
 * ------------------------------------------------------------
 * These are consumed by UI later.
 */
export type CargoFieldUIType =
  | "text"
  | "numeric"
  | "switch"
  | "checkbox"
  | "radio"
  | "dropdown";

/**
 * ------------------------------------------------------------
 * FIELD DEFINITION
 * ------------------------------------------------------------
 */
export interface CargoFieldDefinition {
  /** Unique storage key */
  key: string;

  /** Label shown to cadet */
  label: string;

  /** Optional helper / hint */
  helperText?: string;

  /** UI control hint */
  uiType: CargoFieldUIType;

  /** Dropdown / radio options */
  options?: string[];

  /** Mandatory for completion */
  required: boolean;
}

/**
 * ------------------------------------------------------------
 * GROUP DEFINITION
 * ------------------------------------------------------------
 * Groups allow clean UI sections
 */
export interface CargoFieldGroup {
  /** Logical group key */
  groupKey: string;

  /** Group title */
  title: string;

  /** Group description */
  description?: string;

  /** Ordered fields */
  fields: CargoFieldDefinition[];
}

/**
 * ------------------------------------------------------------
 * PROFILE DEFINITION
 * ------------------------------------------------------------
 */
export interface CargoProfileDefinition {
  profile: CargoProfileKey;
  title: string;
  description: string;
  groups: CargoFieldGroup[];
}

/**
 * ============================================================
 * COMMON GROUPS (REUSED ACROSS SHIP TYPES)
 * ============================================================
 */

/**
 * LOAD LINE & HYDROSTATICS
 * Applicable to ALL ships
 */
const LOAD_LINE_GROUP: CargoFieldGroup = {
  groupKey: "LOAD_LINE",
  title: "Load Line & Hydrostatics",
  description:
    "Load line marks and hydrostatic particulars as per statutory documents.",
  fields: [
    {
      key: "loadLineConvention",
      label: "Load Line Convention",
      uiType: "dropdown",
      options: ["1966", "1988"],
      required: true,
    },
    {
      key: "summerDraft",
      label: "Summer Draft (m)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "winterDraft",
      label: "Winter Draft (m)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "tropicalDraft",
      label: "Tropical Draft (m)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "freshWaterDraft",
      label: "Fresh Water Draft (m)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "fwa",
      label: "Fresh Water Allowance (FWA)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "tpc",
      label: "Tonnes Per Centimeter (TPC)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "blockCoefficient",
      label: "Block Coefficient (CB)",
      uiType: "numeric",
      required: true,
    },
  ],
};

/**
 * TANK CAPACITIES (ENGINE + DECK)
 */
const TANK_CAPACITY_GROUP: CargoFieldGroup = {
  groupKey: "TANK_CAPACITIES",
  title: "Tank Capacities",
  description: "Fuel, ballast, fresh water, and other tank capacities.",
  fields: [
    {
      key: "hfoCapacity",
      label: "HFO Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "lsfoCapacity",
      label: "LSFO Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "mdoCapacity",
      label: "MDO Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "mgoCapacity",
      label: "MGO / LGMGO Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "freshWaterCapacity",
      label: "Fresh Water Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "ballastWaterCapacity",
      label: "Ballast Water Capacity (m³)",
      uiType: "numeric",
      required: true,
    },
    {
      key: "lubeOilCapacity",
      label: "Lube Oil Capacity (m³)",
      uiType: "numeric",
      required: false,
    },
    {
      key: "sludgeCapacity",
      label: "Sludge Tank Capacity (m³)",
      uiType: "numeric",
      required: false,
    },
  ],
};

/**
 * ============================================================
 * SHIP-TYPE–SPECIFIC PROFILES
 * ============================================================
 */

export const CARGO_PROFILES: Record<CargoProfileKey, CargoProfileDefinition> = {
  BULK: {
    profile: "BULK",
    title: "Bulk Carrier — Cargo & Capacities",
    description: "Cargo, load line, and tank particulars for bulk carriers.",
    groups: [
      {
        groupKey: "BULK_CARGO",
        title: "Bulk Cargo Characteristics",
        fields: [
          {
            key: "grainCapacity",
            label: "Grain Capacity (m³)",
            uiType: "numeric",
            required: true,
          },
          {
            key: "baleCapacity",
            label: "Bale Capacity (m³)",
            uiType: "numeric",
            required: true,
          },
          {
            key: "numberOfHolds",
            label: "Number of Cargo Holds",
            uiType: "numeric",
            required: true,
          },
          {
            key: "hatchCoverType",
            label: "Hatch Cover Type",
            uiType: "dropdown",
            options: ["Folding", "Side Rolling", "Pontoon"],
            required: true,
          },
          {
            key: "cargoGearFitted",
            label: "Cargo Gear Fitted",
            uiType: "switch",
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  LIQUID_TANKER: {
    profile: "LIQUID_TANKER",
    title: "Oil / Chemical Tanker — Cargo & Capacities",
    description:
      "Cargo systems, load line, and tank capacities for liquid tankers.",
    groups: [
      {
        groupKey: "TANKER_CARGO",
        title: "Tanker Cargo Systems",
        fields: [
          {
            key: "cargoTankCount",
            label: "Number of Cargo Tanks",
            uiType: "numeric",
            required: true,
          },
          {
            key: "cargoPumpType",
            label: "Cargo Pump Type",
            uiType: "dropdown",
            options: ["Centrifugal", "Framo", "Screw"],
            required: true,
          },

          /**
           * ============================================================
           * STEP 28 — NEW FIELD (Tankers + Chemical Tankers)
           * ============================================================
           *
           * Stripping pump details are recorded only if fitted.
           * The YES/NO gate will be implemented in CargoCapabilitiesSection.tsx.
           *
           * IMPORTANT:
           * - required: false (so it never blocks completion when not fitted)
           * - options are PSC-aligned and training-record friendly
           */
          {
            key: "strippingPumpType",
            label: "Stripping Pump Type",
            helperText:
              "Select only if stripping pump is fitted. Otherwise keep blank.",
            uiType: "dropdown",
            options: [
              "Eductor",
              "Centrifugal",
              "Reciprocating",
              "Portable",
              "Integrated with Cargo Pump",
              "Other",
            ],
            required: false,
          },

          {
            key: "cowFitted",
            label: "Crude Oil Washing (COW) Fitted",
            uiType: "switch",
            required: true,
          },
          {
            key: "igsFitted",
            label: "Inert Gas System (IGS) Fitted",
            uiType: "switch",
            required: true,
          },
          {
            key: "cargoCoating",
            label: "Cargo Tank Coating Type",
            uiType: "dropdown",
            options: ["Epoxy", "None", "Stainless Steel"],
            required: false,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  GAS_TANKER: {
    profile: "GAS_TANKER",
    title: "Gas Carrier — Cargo & Capacities",
    description: "Cargo containment, load line, and tank capacities for gas carriers.",
    groups: [
      {
        groupKey: "GAS_CARGO",
        title: "Gas Cargo Systems",
        fields: [
          {
            key: "containmentSystem",
            label: "Cargo Containment System",
            uiType: "dropdown",
            options: ["Membrane", "Moss", "Type C"],
            required: true,
          },
          {
            key: "boilOffRate",
            label: "Boil-Off Rate (% per day)",
            uiType: "numeric",
            required: true,
          },
          {
            key: "reliquefactionPlant",
            label: "Reliquefaction Plant Fitted",
            uiType: "switch",
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  CONTAINER: {
    profile: "CONTAINER",
    title: "Container Ship — Cargo & Capacities",
    description: "Container capacity, load line, and tank particulars.",
    groups: [
      {
        groupKey: "CONTAINER_CARGO",
        title: "Container Cargo Characteristics",
        fields: [
          {
            key: "teuCapacity",
            label: "Total TEU Capacity",
            uiType: "numeric",
            required: true,
          },
          {
            key: "reeferPlugs",
            label: "Reefer Plugs",
            uiType: "numeric",
            required: true,
          },
          {
            key: "cellGuides",
            label: "Cell Guides Fitted",
            uiType: "switch",
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  CAR_CARRIER: {
    profile: "CAR_CARRIER",
    title: "Car Carrier — Cargo & Capacities",
    description: "Vehicle cargo arrangements and capacity particulars.",
    groups: [
      {
        groupKey: "VEHICLE_CARGO",
        title: "Vehicle Cargo Characteristics",
        fields: [
          {
            key: "laneMeters",
            label: "Lane Meters",
            uiType: "numeric",
            required: true,
          },
          {
            key: "numberOfDecks",
            label: "Number of Vehicle Decks",
            uiType: "numeric",
            required: true,
          },
          {
            key: "rampType",
            label: "Ramp Type",
            uiType: "dropdown",
            options: ["Stern", "Side", "Bow"],
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  RO_RO: {
    profile: "RO_RO",
    title: "Ro-Ro Vessel — Cargo & Capacities",
    description: "Roll-on/roll-off cargo and capacity details.",
    groups: [
      {
        groupKey: "RORO_CARGO",
        title: "Ro-Ro Cargo Characteristics",
        fields: [
          {
            key: "laneMeters",
            label: "Lane Meters",
            uiType: "numeric",
            required: true,
          },
          {
            key: "securingArrangements",
            label: "Cargo Securing Arrangements",
            uiType: "text",
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  GENERAL: {
    profile: "GENERAL",
    title: "General Cargo — Cargo & Capacities",
    description: "General cargo handling and capacity particulars.",
    groups: [
      {
        groupKey: "GENERAL_CARGO",
        title: "General Cargo Characteristics",
        fields: [
          {
            key: "holdCapacity",
            label: "Total Hold Capacity (m³)",
            uiType: "numeric",
            required: true,
          },
          {
            key: "dangerousGoods",
            label: "Dangerous Goods Carried",
            uiType: "switch",
            required: true,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },

  PASSENGER: {
    profile: "PASSENGER",
    title: "Passenger Vessel — Cargo & Capacities",
    description: "Passenger ship cargo, load line, and tank particulars.",
    groups: [
      {
        groupKey: "PASSENGER_CARGO",
        title: "Passenger & Vehicle Capacities",
        fields: [
          {
            key: "passengerCapacity",
            label: "Passenger Capacity",
            uiType: "numeric",
            required: true,
          },
          {
            key: "vehicleCapacity",
            label: "Vehicle Capacity",
            uiType: "numeric",
            required: false,
          },
        ],
      },
      LOAD_LINE_GROUP,
      TANK_CAPACITY_GROUP,
    ],
  },
};
