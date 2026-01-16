//keel-mobile/src/sea-service/seaServiceSchema.ts

/**
 * ============================================================
 * Sea Service Data Schema
 * ============================================================
 *
 * This file defines ALL data fields captured during the
 * Sea Service wizard.
 *
 * IMPORTANT RULES:
 * - This is the SINGLE SOURCE OF TRUTH for field definitions.
 * - UI, validation, defaults, and persistence will rely on this.
 * - Fields are grouped strictly by Sea Service sections.
 *
 * NO UI CODE
 * NO DATABASE CODE
 * NO BUSINESS LOGIC
 */

/**
 * Supported field input types.
 * These will later map to UI components.
 */
export type SeaServiceFieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiselect";

/**
 * Definition of a single Sea Service field.
 */
export interface SeaServiceFieldDefinition {
  /** Unique key used in payload JSON */
  key: string;

  /** Label shown to the cadet */
  label: string;

  /** Field input type */
  type: SeaServiceFieldType;

  /** Optional helper or hint text */
  description?: string;

  /** Whether this field is mandatory */
  required?: boolean;

  /** Used for select / multiselect fields */
  options?: string[];
}

/**
 * ============================================================
 * SEA SERVICE FIELD DEFINITIONS (GROUPED BY SECTION)
 * ============================================================
 */

export const SEA_SERVICE_SCHEMA = {
  /**
   * ------------------------------------------------------------
   * 1. GENERAL IDENTITY & REGISTRY
   * ------------------------------------------------------------
   */
  GENERAL_IDENTITY: [
    { key: "shipName", label: "Ship Name", type: "text", required: true },
    { key: "imoNumber", label: "IMO Number", type: "text" },
    { key: "officialNumber", label: "Official Number", type: "text" },
    { key: "callSign", label: "Call Sign", type: "text" },
    { key: "mmsiNumber", label: "MMSI Number", type: "text" },
    { key: "flagState", label: "Flag State", type: "text", required: true },
    { key: "portOfRegistry", label: "Port of Registry", type: "text" },
    { key: "dateOfRegistry", label: "Date of Registry", type: "date" },
    { key: "dateOfBuild", label: "Date of Build / Keel Laid", type: "date" },
    {
      key: "shipType",
      label: "Ship Type",
      type: "select",
      required: true,
      description: "Type of vessel as per company / classification",
    },
    { key: "classificationSociety", label: "Classification Society", type: "text" },
    { key: "pAndIClub", label: "P&I Club", type: "text" },
    { key: "shipOwner", label: "Ship Owner", type: "text" },
    { key: "shipManager", label: "Ship Manager / Operator", type: "text" },
    {
      key: "crewComplement",
      label: "Crew Complement (Max Certified)",
      type: "number",
    },
  ],

  /**
   * ------------------------------------------------------------
   * 2. DIMENSIONS & TONNAGES
   * ------------------------------------------------------------
   */
  DIMENSIONS_TONNAGE: [
    { key: "grossTonnage", label: "Gross Tonnage (GT)", type: "number" },
    { key: "netTonnage", label: "Net Tonnage (NT)", type: "number" },
    { key: "deadweight", label: "Deadweight Tonnage (DWT)", type: "number" },
    {
      key: "lightshipDisplacement",
      label: "Lightship Displacement",
      type: "number",
    },
    { key: "loa", label: "Length Overall (LOA)", type: "number" },
    {
      key: "lbp",
      label: "Length Between Perpendiculars (LBP)",
      type: "number",
    },
    { key: "breadth", label: "Breadth (Moulded)", type: "number" },
    { key: "depth", label: "Depth (Moulded)", type: "number" },
    { key: "summerDraft", label: "Summer Draft", type: "number" },
    { key: "winterDraft", label: "Winter Draft", type: "number" },
    { key: "airDraft", label: "Air Draft", type: "number" },
    { key: "summerFreeboard", label: "Freeboard (Summer)", type: "number" },
    {
      key: "bridgeToBow",
      label: "Distance: Bridge to Bow",
      type: "number",
    },
    {
      key: "bridgeToStern",
      label: "Distance: Bridge to Stern",
      type: "number",
    },
  ],

  /**
   * ------------------------------------------------------------
   * 3. MAIN PROPULSION & PERFORMANCE
   * ------------------------------------------------------------
   */
  PROPULSION_PERFORMANCE: [
    { key: "mainEngineMake", label: "Main Engine Make & Model", type: "text" },
    {
      key: "mainEngineType",
      label: "Main Engine Type",
      type: "select",
      options: ["2-stroke", "4-stroke"],
    },
    {
      key: "numberOfMainEngines",
      label: "Number of Main Engines",
      type: "number",
    },
    {
      key: "mcrPower",
      label: "Maximum Continuous Rating (MCR)",
      type: "number",
    },
    { key: "rpmAtMcr", label: "RPM at MCR", type: "number" },
    { key: "serviceSpeed", label: "Service Speed (knots)", type: "number" },
    {
      key: "fuelTypes",
      label: "Fuel Type(s)",
      type: "multiselect",
      options: ["HFO", "MDO", "LSFO", "LNG", "Methanol"],
    },
    {
      key: "dailyFuelConsumption",
      label: "Daily Fuel Consumption at Service Speed",
      type: "number",
    },
    {
      key: "propellerType",
      label: "Propeller Type",
      type: "select",
      options: ["Fixed Pitch", "Controllable Pitch"],
    },
    {
      key: "numberOfPropellers",
      label: "Number of Propellers",
      type: "number",
    },
    { key: "rudderType", label: "Rudder Type", type: "text" },
  ],

  /**
   * ------------------------------------------------------------
   * 4. AUXILIARY MACHINERY & ELECTRICAL
   * ------------------------------------------------------------
   */
  AUX_MACHINERY_ELECTRICAL: [
    { key: "generatorMake", label: "Main Generators Make & Model", type: "text" },
    { key: "numberOfGenerators", label: "Number of Generators", type: "number" },
    { key: "generatorOutput", label: "Generator Output (kW/kVA)", type: "number" },
    {
      key: "emergencyGenerator",
      label: "Emergency Generator Make & Model",
      type: "text",
    },
    {
      key: "emergencyGeneratorOutput",
      label: "Emergency Generator Output (kW)",
      type: "number",
    },
    {
      key: "shaftGenerator",
      label: "Shaft Generator Available",
      type: "boolean",
    },
    {
      key: "mainSupplyVoltage",
      label: "Main Supply Voltage / Frequency",
      type: "text",
    },
    {
      key: "lightingVoltage",
      label: "Lighting Supply Voltage",
      type: "text",
    },
    { key: "boilerType", label: "Boiler Make & Type", type: "text" },
    { key: "boilerPressure", label: "Boiler Working Pressure", type: "number" },
    {
      key: "freshWaterGenerator",
      label: "Fresh Water Generator Type",
      type: "text",
    },
    { key: "ows", label: "Oily Water Separator Make & Model", type: "text" },
    {
      key: "sewagePlant",
      label: "Sewage Treatment Plant Make & Model",
      type: "text",
    },
    { key: "incinerator", label: "Incinerator Make", type: "text" },
    {
      key: "purifiers",
      label: "Purifiers (Fuel / Lube) Make",
      type: "text",
    },
    {
      key: "airCompressors",
      label: "Air Compressors Make & Pressure",
      type: "text",
    },
  ],

  /**
   * ------------------------------------------------------------
   * 10. INERT GAS SYSTEM (TANKERS / GAS CARRIERS)
   * ------------------------------------------------------------
   */
  INERT_GAS_SYSTEM: [
    {
      key: "igsSource",
      label: "IGS Source Type",
      type: "select",
      options: [
        "Flue Gas",
        "Independent Inert Gas Generator",
        "Nitrogen Generator",
      ],
    },
    {
      key: "igsCapacity",
      label: "IGS Blower Capacity (m³/hr)",
      type: "number",
    },
    {
      key: "oxygenAnalyzers",
      label: "Oxygen Analyzer Details",
      type: "text",
    },
    {
      key: "deckWaterSeal",
      label: "Deck Water Seal Type",
      type: "select",
      options: ["Wet", "Semi-dry", "Dry"],
    },
    {
      key: "pvValves",
      label: "PV Valve Details & Settings",
      type: "text",
    },
    {
      key: "mastRiser",
      label: "Mast Riser / Venting System",
      type: "text",
    },
  ],
};

/**
 * ============================================================
 * NOTES
 * ============================================================
 *
 * - Some sections (e.g. IGS) will only be rendered
 *   if enabled by ship type configuration.
 *
 * - This schema is intentionally verbose to ensure
 *   long-term extensibility without DB migrations.
 */
