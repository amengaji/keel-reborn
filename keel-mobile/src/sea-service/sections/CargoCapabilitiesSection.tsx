//keel-mobile/src/sea-service/sections/CargoCapabilitiesSection.tsx

/**
 * ============================================================
 * Sea Service — Cargo Capabilities Section
 * ============================================================
 *
 * PURPOSE:
 * - Render cargo capability fields dynamically
 *   based on selected ship type
 *
 * RULES:
 * - Draft-safe (partial save allowed)
 * - Completion handled ONLY in SeaServiceWizard
 * - Sticky Save bar (correct height)
 *
 * PSC / AUDIT UX RULE (NEW):
 * - Each cargo GROUP must have a YES/NO gate first
 * - If NO → group hidden, considered explicitly "not fitted / not applicable"
 * - If YES → show group fields and treat them as required (as per existing logic)
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  HelperText,
  Switch,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import YesNoCapsule from "../../components/common/YesNoCapsule";
import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

import {
  CARGO_PROFILES,
  CargoProfileKey,
  CargoFieldDefinition,
  CargoFieldGroup,
} from "../../config/cargoProfiles";

/**
 * Section key used by SeaServiceWizard
 */
const SECTION_KEY = "CARGO_CAPABILITIES";

/**
 * ------------------------------------------------------------
 * MAP SHIP TYPE → CARGO PROFILE
 * ------------------------------------------------------------
 */
function mapShipTypeToCargoProfile(shipType?: string): CargoProfileKey | null {
  if (!shipType) return null;

  /**
   * ============================================================
   * NORMALIZE SHIP TYPE
   * ============================================================
   * Examples:
   * "Bulk Carrier"   → "BULK_CARRIER"
   * "Oil Tanker"    → "OIL_TANKER"
   * "Ro-Ro"         → "RO_RO"
   */
  const normalized = shipType
    .toUpperCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .trim();

  switch (normalized) {
    case "BULK_CARRIER":
      return "BULK";

    case "OIL_TANKER":
    case "CHEMICAL_TANKER":
      return "LIQUID_TANKER";

    case "GAS_TANKER":
      return "GAS_TANKER";

    case "CONTAINER":
    case "CONTAINER_SHIP":
      return "CONTAINER";

    case "CAR_CARRIER":
      return "CAR_CARRIER";

    case "RO_RO":
    case "RORO":
      return "RO_RO";

    case "GENERAL_CARGO":
      return "GENERAL";

    case "PASSENGER":
      return "PASSENGER";

    default:
      return null;
  }
}

/**
 * FIELD-LEVEL GATE KEYS (PSC-CORRECT)
 */
const CARGO_PUMPS_FITTED_KEY = "__cargoPumpsFitted__";


/**
 * ------------------------------------------------------------
 * PSC-SAFE: SHIP TYPE → CONTAINMENT LABEL
 * ------------------------------------------------------------
 *
 * WHY:
 * - Dry cargo ships use "Cargo Holds"
 * - Tankers / gas carriers use "Cargo Tanks"
 * - If unclear, use neutral "Cargo Containment"
 */
function getCargoContainmentGateLabel(
  cargoProfileKey?: CargoProfileKey
): string {
  if (!cargoProfileKey) return "Cargo Containment fitted";

  if (cargoProfileKey === "LIQUID_TANKER" || cargoProfileKey === "GAS_TANKER") {
    return "Cargo Tanks fitted";
  }

  // BULK / CONTAINER / GENERAL / RO-RO / CAR CARRIER / PASSENGER
  return "Cargo Holds fitted";
}

/**
 * ------------------------------------------------------------
 * INTERNAL: Gate key generator (stored in form JSON)
 * ------------------------------------------------------------
 *
 * IMPORTANT:
 * - Does NOT require profile changes
 * - Backward compatible with existing saved JSON
 */
function groupGateKey(groupKey: string): string {
  return `__groupEnabled__${groupKey}`;
}

export default function CargoCapabilitiesSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * ------------------------------------------------------------
   * PROFILE RESOLUTION
   * ------------------------------------------------------------
   */
  const cargoProfileKey: CargoProfileKey | undefined = useMemo(() => {
    const normalizedShipType = payload.shipType ?? undefined;
    return mapShipTypeToCargoProfile(normalizedShipType) ?? undefined;
  }, [payload.shipType]);

  const cargoProfile = cargoProfileKey ? CARGO_PROFILES[cargoProfileKey] : null;

  /**
   * ------------------------------------------------------------
   * LOAD EXISTING DRAFT
   * ------------------------------------------------------------
   */
  const existingData =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   */
  const [form, setForm] = useState<Record<string, any>>({});

  /**
   * ------------------------------------------------------------
   * FIRST GROUP ONLY (STEP 1 OF MANY)
   * ------------------------------------------------------------
   *
   * We are implementing the YES/NO gate ONLY for the first group
   * in this step, to keep changes minimal and audit-safe.
   */
  const firstGroupKey: string | null = useMemo(() => {
    if (!cargoProfile) return null;
    return cargoProfile.groups?.[0]?.groupKey ?? null;
  }, [cargoProfileKey]);

    /**
     * ------------------------------------------------------------
     * Cargo Handling Gear — IDENTIFIED BY GROUP KEY (NOT POSITION)
     * ------------------------------------------------------------
     *
     * WHY:
     * - Group order varies by ship type
     * - Index-based gating breaks PSC logic
     * - We match by semantic group identity instead
     */
    const cargoHandlingGroupKey: string | null = useMemo(() => {
      if (!cargoProfile) return null;

      return (
        cargoProfile.groups.find((group) =>
          group.groupKey.toUpperCase().includes("HANDLING")
        )?.groupKey ?? null
      );
    }, [cargoProfileKey]);

      /**
       * ------------------------------------------------------------
       * Cargo Pumps — IDENTIFIED BY GROUP KEY (ROBUST SEMANTIC MATCH)
       * ------------------------------------------------------------
       *
       * WHY:
       * - Group keys may use PUMP or PUMPING
       * - Must be resilient to profile naming differences
       * - Never rely on index or exact string equality
       */
      const cargoPumpsGroupKey: string | null = useMemo(() => {
        if (!cargoProfile) return null;

        return (
          cargoProfile.groups.find((group) => {
            const key = group.groupKey.toUpperCase();
            return key.includes("PUMP");
          })?.groupKey ?? null
        );
      }, [cargoProfileKey]);


/**
 * ============================================================
 * STRIPPING PUMP — FIELD-LEVEL GATE & KEYS (INDEPENDENT)
 * ============================================================
 */
const STRIPPING_PUMP_FITTED_KEY = "__strippingPumpFitted__";

const STRIPPING_PUMP_TYPE_KEYS = [
  { key: "strippingPump_Eductor", label: "Eductor" },
  { key: "strippingPump_Centrifugal", label: "Centrifugal" },
  { key: "strippingPump_Reciprocating", label: "Reciprocating" },
  { key: "strippingPump_Portable", label: "Portable" },
  { key: "strippingPump_Integrated", label: "Integrated with Cargo Pump" },
  { key: "strippingPump_Other", label: "Other" },
] as const;



  const firstGroupGateLabel = useMemo(() => {
    return getCargoContainmentGateLabel(cargoProfileKey);
  }, [cargoProfileKey]);

  /**
   * Initialise form when profile loads
   */
/**
   * Initialise form when profile loads
   */
  useEffect(() => {
    if (!cargoProfile) return;

    const initialState: Record<string, any> = {};

    // Stripping Pump — fitted gate (default false)
initialState[STRIPPING_PUMP_FITTED_KEY] =
  (existingData as any)[STRIPPING_PUMP_FITTED_KEY] ?? false;

// Stripping Pump — independent type flags
STRIPPING_PUMP_TYPE_KEYS.forEach(({ key }) => {
  initialState[key] = (existingData as any)[key] ?? false;
});


    initialState[CARGO_PUMPS_FITTED_KEY] =
  (existingData as any)[CARGO_PUMPS_FITTED_KEY] ?? false;


    cargoProfile.groups.forEach((group: CargoFieldGroup) => {
      // 1. First Group Gate (Containment)
      if (firstGroupKey && group.groupKey === firstGroupKey) {
        const gKey = groupGateKey(group.groupKey);
        initialState[gKey] = (existingData as any)[gKey] ?? false;
      }

      // 2. Cargo Handling Gear Gate
      if (
        cargoHandlingGroupKey &&
        group.groupKey === cargoHandlingGroupKey
      ) {
        const gKey = groupGateKey(group.groupKey);
        initialState[gKey] = (existingData as any)[gKey] ?? false;
      }

      // 3. Cargo Pumps Gate
      if (
        cargoPumpsGroupKey &&
        group.groupKey === cargoPumpsGroupKey
      ) {
        const gKey = groupGateKey(group.groupKey);
        initialState[gKey] = (existingData as any)[gKey] ?? false;
      }

      // Standard Fields
      group.fields.forEach((field: CargoFieldDefinition) => {
        initialState[field.key] = (existingData as any)[field.key] ?? "";
      });
    });

    setForm(initialState);
  }, [
    cargoProfileKey,
    firstGroupKey,
    cargoHandlingGroupKey,
    cargoPumpsGroupKey, // Ensure this dependency exists
  ]);


  /**
   * ------------------------------------------------------------
   * FIELD UPDATE
   * ------------------------------------------------------------
   */
  const updateField = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * ------------------------------------------------------------
   * SAVE (DRAFT SAFE + TOAST ERROR HANDLING)
   * ------------------------------------------------------------
   */
  const handleSave = () => {
    try {
      /**
       * ============================================================
       * Draft-safe save (partial allowed)
       * ============================================================
       *
       * - Partial entries → IN_PROGRESS
       * - Fully filled → COMPLETE
       * - Status computed centrally in SeaServiceContext
       */
      updateSection(SECTION_KEY, form);

      /**
       * PSC UX DETAIL:
       * - Boolean FALSE is a valid answer and must NOT inflate "filledCount"
       * - We count:
       *   - non-empty strings
       *   - numbers
       *   - boolean TRUE only
       */
      const filledCount = Object.values(form).filter((v) => {
        if (v === null || v === undefined) return false;

        if (typeof v === "boolean") return v === true; // only TRUE counts

        if (typeof v === "number") return true;

        return String(v).trim().length > 0;
      }).length;

      if (filledCount === 0) {
        toast.info("Saved as draft.");
      } else {
        toast.info(
          "Saved as draft. Complete all fields to mark this section as Completed."
        );
      }

      /**
       * ============================================================
       * UX RULE:
       * After saving, always return to Sections overview
       * ============================================================
       */
      if (onSaved) {
        onSaved();
      }
    } catch (e: any) {
      toast.error(
        e?.message
          ? `Save failed: ${e.message}`
          : "Save failed due to an unexpected error."
      );
    }
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  if (!cargoProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAwareScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            Cargo Capabilities
          </Text>

          <HelperText type="error" visible>
            Cargo profile could not be determined for the selected ship type.
          </HelperText>
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* =====================================================
          SCROLLABLE CONTENT
          ===================================================== */}
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          {cargoProfile.title}
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          {cargoProfile.description}
        </Text>

        {cargoProfile.groups.map((group) => {
          const isFirstGroup =
            firstGroupKey && group.groupKey === firstGroupKey;

          const isCargoHandlingGroup =
            cargoHandlingGroupKey &&
            group.groupKey === cargoHandlingGroupKey;

          const isCargoPumpsGroup =
            cargoPumpsGroupKey &&
            group.groupKey === cargoPumpsGroupKey;

          /**
           * Resolve gate key ONCE for any gated group
           */
          const gateKey =
            isFirstGroup ||
            isCargoHandlingGroup ||
            isCargoPumpsGroup
              ? groupGateKey(group.groupKey)
              : null;

          /**
           * If group is gated, visibility depends on gate value.
           * Otherwise, group is always visible.
           */
          const gateValue = gateKey ? Boolean(form[gateKey]) : true;


          return (
            <View key={group.groupKey} style={styles.groupBlock}>
              <Divider style={styles.divider} />

              <Text variant="titleMedium" style={styles.groupTitle}>
                {group.title}
              </Text>

              {group.description && (
                <Text variant="bodySmall" style={styles.groupDescription}>
                  {group.description}
                </Text>
              )}

              {/* =====================================================
                  STEP 19: FIRST GROUP ONLY — PSC YES/NO GATE
                  ===================================================== */}
              {isFirstGroup && gateKey && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{firstGroupGateLabel}</Text>
                  <YesNoCapsule
                    value={Boolean(form[gateKey])}
                    onChange={(v) => updateField(gateKey, v)}
                  />
                </View>
              )}
              {/* =====================================================
                  STEP 22: SECOND GROUP ONLY — PSC YES/NO GATE
                  ===================================================== */}
                  {isCargoHandlingGroup && (
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>
                        Cargo Handling Gear fitted?
                      </Text>
                      <YesNoCapsule
                        value={Boolean(form[groupGateKey(group.groupKey)])}
                        onChange={(v) =>
                          updateField(groupGateKey(group.groupKey), v)
                        }
                      />
                    </View>
                  )}


              {/* =====================================================
                  GROUP FIELDS
                  ===================================================== */}
              <Divider style={styles.divider} />

              {/* If first-group gate is NO → hide fields */}
              {(!gateKey || Boolean(form[gateKey])) &&
                group.fields.map((field) => {
                  const value = form[field.key];
                  /**
                 * =====================================================
                 * FIELD-LEVEL OVERRIDE — COW (PSC YES/NO CAPSULE)
                 * =====================================================
                 * Replaces generic switch rendering for cowFitted
                 */
                if (field.key === "cowFitted") {
                  return (
                    <View key="cowFittedGate" style={styles.row}>
                      <Text style={styles.rowLabel}>
                        {field.label}
                      </Text>
                      <YesNoCapsule
                        value={Boolean(form.cowFitted)}
                        onChange={(v) => updateField("cowFitted", v)}
                      />
                    </View>
                  );
                }
                /**
                 * =====================================================
                 * FIELD-LEVEL OVERRIDE — INERT GAS SYSTEM (PSC YES/NO CAPSULE)
                 * =====================================================
                 * Replaces generic switch rendering for igsFitted
                 */
                if (field.key === "igsFitted") {
                  return (
                    <View key="igsFittedGate" style={styles.row}>
                      <Text style={styles.rowLabel}>
                        {field.label}
                      </Text>
                      <YesNoCapsule
                        value={Boolean(form.igsFitted)}
                        onChange={(v) => updateField("igsFitted", v)}
                      />
                    </View>
                  );
                }


                  /**
                 * =====================================================
                 * FIELD-LEVEL GATE — Cargo Pumps
                 * =====================================================
                 *
                 * Cargo Pump Type is a segmentedButtons field
                 * Gate controls ONLY this field
                 */
                if (field.key === "cargoPumpType") {
                  return (
                    <View key="cargoPumpsGateBlock">
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>
                          Cargo Pumps fitted?
                        </Text>
                        <YesNoCapsule
                          value={Boolean(form[CARGO_PUMPS_FITTED_KEY])}
                          onChange={(v) =>
                            updateField(CARGO_PUMPS_FITTED_KEY, v)
                          }
                        />
                      </View>

                      {Boolean(form[CARGO_PUMPS_FITTED_KEY]) && (
                        <View style={styles.segmentBlock}>
                          <Text style={styles.segmentLabel}>
                            {field.label}
                          </Text>

                          <SegmentedButtons
                            value={String(value ?? "")}
                            onValueChange={(v) => updateField(field.key, v)}
                            buttons={(field.options ?? []).map((opt) => {
                              const isSelected = String(value) === opt;

                              return {
                                value: opt,
                                label: opt,
                                style: {
                                  borderColor: "#3194A0",
                                  backgroundColor: isSelected
                                    ? "rgba(49, 148, 160, 0.15)"
                                    : "transparent",
                                },
                                labelStyle: {
                                  color: isSelected ? "#3194A0" : undefined,
                                  fontWeight: isSelected ? "700" : "500",
                                },
                              };
                            })}
                          />
                        </View>
                      )}
                    </View>
                  );
                }

                /**
                 * =====================================================
                 * FIELD-LEVEL OVERRIDE — Stripping Pump (Independent YES/NO)
                 * =====================================================
                 * - Replaces dropdown rendering for strippingPumpType
                 * - Multiple selections allowed (PSC-correct)
                 * - Uses YesNoCapsule throughout
                 */
                if (field.key === "strippingPumpType") {
                  return (
                    <View key="strippingPumpBlock">
                      {/* Top-level fitted gate */}
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>
                          Stripping Pump fitted?
                        </Text>
                        <YesNoCapsule
                          value={Boolean(form[STRIPPING_PUMP_FITTED_KEY])}
                          onChange={(v) =>
                            updateField(STRIPPING_PUMP_FITTED_KEY, v)
                          }
                        />
                      </View>

                      {/* Per-type independent YES/NO (only if fitted) */}
                      {Boolean(form[STRIPPING_PUMP_FITTED_KEY]) && (
                        <View style={{ marginTop: 8 }}>
                          {STRIPPING_PUMP_TYPE_KEYS.map(({ key, label }) => (
                            <View key={key} style={styles.row}>
                              <Text style={styles.rowLabel}>{label}</Text>
                              <YesNoCapsule
                                value={Boolean(form[key])}
                                onChange={(v) => updateField(key, v)}
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }



                  if (field.uiType === "text" || field.uiType === "numeric") {
                    return (
                      <TextInput
                        key={field.key}
                        label={field.label}
                        value={String(value ?? "")}
                        onChangeText={(v) => updateField(field.key, v)}
                        keyboardType={
                          field.uiType === "numeric" ? "numeric" : "default"
                        }
                        mode="outlined"
                        style={styles.input}
                      />
                    );
                  }

                  /**
                   * NOTE:
                   * Per your approval, we are adding YES/NO gates per GROUP.
                   * Field-level switches will be handled later, in a separate step,
                   * to keep this change minimal and safe.
                   */
                  if (field.uiType === "switch") {
                    return (
                      <View key={field.key} style={styles.switchRow}>
                        <Text>{field.label}</Text>
                        <Switch
                          value={Boolean(value)}
                          onValueChange={(v) => updateField(field.key, v)}
                        />
                      </View>
                    );
                  }

                  if (field.uiType === "dropdown" || field.uiType === "radio") {
                    return (
                      <View key={field.key} style={styles.segmentBlock}>
                        <Text style={styles.segmentLabel}>{field.label}</Text>

                        <SegmentedButtons
                          value={String(value ?? "")}
                          onValueChange={(v) => updateField(field.key, v)}
                          buttons={(field.options ?? []).map((opt) => {
                            const isSelected = String(value) === opt;

                            return {
                              value: opt,
                              label: opt,

                              /**
                               * ========================================================
                               * BRAND-ALIGNED SELECTED STYLE
                               * ========================================================
                               */
                              style: {
                                borderColor: "#3194A0",
                                backgroundColor: isSelected
                                  ? "rgba(49, 148, 160, 0.15)"
                                  : "transparent",
                              },

                              labelStyle: {
                                color: isSelected ? "#3194A0" : undefined,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            };
                          })}
                        />
                      </View>
                    );
                  }

                  return null;
                })}
            </View>
          );
        })}
      </KeyboardAwareScrollView>

      {/* =====================================================
          STICKY SAVE BAR
          ===================================================== */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button mode="contained" onPress={handleSave}>
          Save Section
        </Button>
      </View>
    </View>
  );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },
  groupBlock: {
    marginBottom: 20,
  },
  groupTitle: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  groupDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },

  /**
   * PSC gate row (label left, segmented YES/NO right)
   */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
    fontWeight: "600",
  },

  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  segmentBlock: {
    marginBottom: 14,
  },
  segmentLabel: {
    marginBottom: 6,
    fontWeight: "600",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
