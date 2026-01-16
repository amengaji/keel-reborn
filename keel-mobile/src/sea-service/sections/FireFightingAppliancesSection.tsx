//keel-mobile/src/sea-service/sections/FireFightingAppliancesSection.tsx

/**
 * ============================================================
 * Sea Service — Fire Fighting Appliances (FFA)
 * ============================================================
 *
 * DESIGN GOALS:
 * - SOLAS / STCW / PSC audit-correct
 * - Draft-safe ALWAYS
 * - Wizard controls completion & status (NOT this file)
 * - Space-based fixed fire systems
 * - Multiple systems per space allowed
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  Checkbox,
  Menu,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

const SECTION_KEY = "FIRE_FIGHTING_APPLIANCES";

/* ============================================================
 * Helpers
 * ============================================================ */
const onlyNumber = (v: string) => v.replace(/[^\d]/g, "");
const hasText = (v: any) => typeof v === "string" && v.trim().length > 0;

export default function FireFightingAppliancesSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation();
  const { payload, updateSection } = useSeaService();

  const existing =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState<any>({});

  const [nozzleMenuOpen, setNozzleMenuOpen] = useState(false);

  /* ============================================================
   * Draft-safe initialisation
   * ============================================================ */
  useEffect(() => {
    setForm({
      /* ---------------- FIRE MAIN & PUMPS ---------------- */
      fireMainAvailable: existing.fireMainAvailable ?? false,
      fireMainPressureBar: existing.fireMainPressureBar ?? "",

      emergencyFirePumpAvailable:
        existing.emergencyFirePumpAvailable ?? false,
      emergencyFirePumpType:
        existing.emergencyFirePumpType ?? "",
      emergencyFirePumpLocation:
        existing.emergencyFirePumpLocation ?? "",

      /* ---------------- HYDRANTS / HOSES ---------------- */
      hydrantsAvailable: existing.hydrantsAvailable ?? false,
      hydrantsCount: existing.hydrantsCount ?? "",
      hosesAvailable: existing.hosesAvailable ?? false,
      hosesCount: existing.hosesCount ?? "",
      nozzleType: existing.nozzleType ?? "",
      internationalShoreConnectionAvailable:
        existing.internationalShoreConnectionAvailable ?? false,

      /* ---------------- PORTABLE EXTINGUISHERS ---------------- */
      dcpExtinguishersAvailable:
        existing.dcpExtinguishersAvailable ?? false,
      dcpExtinguishersCount:
        existing.dcpExtinguishersCount ?? "",

      co2ExtinguishersAvailable:
        existing.co2ExtinguishersAvailable ?? false,
      co2ExtinguishersCount:
        existing.co2ExtinguishersCount ?? "",

      foamExtinguishersAvailable:
        existing.foamExtinguishersAvailable ?? false,
      foamExtinguishersCount:
        existing.foamExtinguishersCount ?? "",

      waterMistExtinguishersAvailable:
        existing.waterMistExtinguishersAvailable ?? false,
      waterMistExtinguishersCount:
        existing.waterMistExtinguishersCount ?? "",

      /* ---------------- LEGACY (kept for drafts) ---------------- */
      fixedFireSystemAvailable:
        existing.fixedFireSystemAvailable ?? false,
      fixedFireSystemType:
        existing.fixedFireSystemType ?? "",
      fixedFireSystemCoverage:
        existing.fixedFireSystemCoverage ?? "",

      /* ---------------- FIXED SYSTEMS STATE (ALL SPACES) ---------------- */
      /* (filled in Part 2) */

      /* ---------------- DETECTION & PPE ---------------- */
      fireDetectionAlarmAvailable:
        existing.fireDetectionAlarmAvailable ?? false,
      detectionType:
        existing.detectionType ?? "",
      manualCallPointsAvailable:
        existing.manualCallPointsAvailable ?? false,

      firemansOutfitAvailable:
        existing.firemansOutfitAvailable ?? false,
      firemansOutfitSets:
        existing.firemansOutfitSets ?? "",

      breathingApparatusAvailable:
        existing.breathingApparatusAvailable ?? false,
      breathingApparatusSets:
        existing.breathingApparatusSets ?? "",
      spareCylindersCount:
        existing.spareCylindersCount ?? "",

      eebdAvailable:
        existing.eebdAvailable ?? false,
      eebdCount:
        existing.eebdCount ?? "",

      fireControlPlanAvailable:
        existing.fireControlPlanAvailable ?? false,
      fireStationAvailable:
        existing.fireStationAvailable ?? false,

      remarks:
        existing.remarks ?? "",
    });
  }, []);

  const set = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  const hasAnyData = useMemo(
    () =>
      Object.values(form).some(
        (v) => String(v ?? "").trim() !== "" && v !== false
      ),
    [form]
  );

  const save = () => {
    updateSection(SECTION_KEY, form);

    toast.info(
      hasAnyData
        ? "Fire Fighting Appliances saved."
        : "Fire Fighting Appliances saved (empty draft)."
    );

    /**
     * UX RULE (GLOBAL):
     * Saving a section ALWAYS returns to Sections overview
     * Cadet should continue with next section, not exit wizard
     */
    navigation.goBack();
  };


  /* ============================================================
   * RENDER — PART 1 SECTIONS
   * ============================================================ */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Fire Fighting Appliances
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Record firefighting equipment fitted onboard. You may save partially.
      </Text>

      {/* ============================================================
         1) FIRE MAIN & PUMPS
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Fire Main & Pumps
      </Text>

      <Checkbox.Item
        label="Fire main available"
        status={form.fireMainAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("fireMainAvailable", !form.fireMainAvailable)
        }
      />

      {form.fireMainAvailable && (
        <TextInput
          label="Fire main pressure (bar)"
          value={form.fireMainPressureBar}
          onChangeText={(v) =>
            set("fireMainPressureBar", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Emergency fire pump available"
        status={
          form.emergencyFirePumpAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "emergencyFirePumpAvailable",
            !form.emergencyFirePumpAvailable
          )
        }
      />

      {form.emergencyFirePumpAvailable && (
        <>
          <TextInput
            label="Emergency fire pump type"
            value={form.emergencyFirePumpType}
            onChangeText={(v) =>
              set("emergencyFirePumpType", v)
            }
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Emergency fire pump location"
            value={form.emergencyFirePumpLocation}
            onChangeText={(v) =>
              set("emergencyFirePumpLocation", v)
            }
            mode="outlined"
            style={styles.input}
          />
        </>
      )}

      {/* ============================================================
         2) HYDRANTS, HOSES & NOZZLES
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Hydrants, Hoses & Nozzles
      </Text>

      <Checkbox.Item
        label="Hydrants available"
        status={form.hydrantsAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("hydrantsAvailable", !form.hydrantsAvailable)
        }
      />

      {form.hydrantsAvailable && (
        <TextInput
          label="Number of hydrants"
          value={form.hydrantsCount}
          onChangeText={(v) =>
            set("hydrantsCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Fire hoses available"
        status={form.hosesAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("hosesAvailable", !form.hosesAvailable)
        }
      />

      {form.hosesAvailable && (
        <TextInput
          label="Number of hoses"
          value={form.hosesCount}
          onChangeText={(v) =>
            set("hosesCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      {/* ============================================================
         3) PORTABLE FIRE EXTINGUISHERS
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Portable Fire Extinguishers
      </Text>

      <Checkbox.Item
        label="DCP extinguishers"
        status={
          form.dcpExtinguishersAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "dcpExtinguishersAvailable",
            !form.dcpExtinguishersAvailable
          )
        }
      />

      {form.dcpExtinguishersAvailable && (
        <TextInput
          label="Number of DCP extinguishers"
          value={form.dcpExtinguishersCount}
          onChangeText={(v) =>
            set("dcpExtinguishersCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="CO₂ extinguishers"
        status={
          form.co2ExtinguishersAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "co2ExtinguishersAvailable",
            !form.co2ExtinguishersAvailable
          )
        }
      />

      {form.co2ExtinguishersAvailable && (
        <TextInput
          label="Number of CO₂ extinguishers"
          value={form.co2ExtinguishersCount}
          onChangeText={(v) =>
            set("co2ExtinguishersCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Foam extinguishers"
        status={
          form.foamExtinguishersAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "foamExtinguishersAvailable",
            !form.foamExtinguishersAvailable
          )
        }
      />

      {form.foamExtinguishersAvailable && (
        <TextInput
          label="Number of foam extinguishers"
          value={form.foamExtinguishersCount}
          onChangeText={(v) =>
            set("foamExtinguishersCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Water Mist extinguishers"
        status={
          form.waterMistExtinguishersAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "waterMistExtinguishersAvailable",
            !form.waterMistExtinguishersAvailable
          )
        }
      />

      {form.waterMistExtinguishersAvailable && (
        <TextInput
          label="Number of Water Mist extinguishers"
          value={form.waterMistExtinguishersCount}
          onChangeText={(v) =>
            set(
              "waterMistExtinguishersCount",
              onlyNumber(v)
            )
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      {/* ============================================================
         4) FIXED FIRE-FIGHTING SYSTEMS (SPACE-BASED, MULTI-SYSTEM)
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Fixed Fire-Fighting Systems
      </Text>

      <Text variant="bodySmall" style={{ opacity: 0.8, marginBottom: 8 }}>
        Multiple fixed systems may exist in the same space (e.g. CO₂ total
        flooding + Water Mist local application).
      </Text>

      {/* ================= ENGINE ROOM ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Engine Room / Machinery Spaces
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Engine Room"
        status={form.engineRoomFixedAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("engineRoomFixedAvailable", !form.engineRoomFixedAvailable)
        }
      />

      {form.engineRoomFixedAvailable && (
        <>
          <Checkbox.Item
            label="CO₂ (Total Flooding)"
            status={
              form.engineRoomFixedCO2Available ? "checked" : "unchecked"
            }
            onPress={() =>
              set(
                "engineRoomFixedCO2Available",
                !form.engineRoomFixedCO2Available
              )
            }
          />
          {form.engineRoomFixedCO2Available && (
            <TextInput
              label="CO₂ remarks"
              value={form.engineRoomFixedCO2Remarks}
              onChangeText={(v) =>
                set("engineRoomFixedCO2Remarks", v)
              }
              mode="outlined"
              style={styles.input}
            />
          )}

          <Checkbox.Item
            label="Water Mist / Hyper Mist / Hi-Fog"
            status={
              form.engineRoomFixedWaterMistAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "engineRoomFixedWaterMistAvailable",
                !form.engineRoomFixedWaterMistAvailable
              )
            }
          />
          {form.engineRoomFixedWaterMistAvailable && (
            <TextInput
              label="Water Mist remarks"
              value={form.engineRoomFixedWaterMistRemarks}
              onChangeText={(v) =>
                set("engineRoomFixedWaterMistRemarks", v)
              }
              mode="outlined"
              style={styles.input}
            />
          )}

          <Checkbox.Item
            label="Local Application (Water Spray)"
            status={
              form.engineRoomFixedLocalAppAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "engineRoomFixedLocalAppAvailable",
                !form.engineRoomFixedLocalAppAvailable
              )
            }
          />
          {form.engineRoomFixedLocalAppAvailable && (
            <TextInput
              label="Local application remarks"
              value={form.engineRoomFixedLocalAppRemarks}
              onChangeText={(v) =>
                set("engineRoomFixedLocalAppRemarks", v)
              }
              mode="outlined"
              style={styles.input}
            />
          )}

          <Checkbox.Item
            label="Foam (Low Expansion)"
            status={
              form.engineRoomFixedFoamLowExpAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "engineRoomFixedFoamLowExpAvailable",
                !form.engineRoomFixedFoamLowExpAvailable
              )
            }
          />
          {form.engineRoomFixedFoamLowExpAvailable && (
            <TextInput
              label="Foam system remarks"
              value={form.engineRoomFixedFoamLowExpRemarks}
              onChangeText={(v) =>
                set("engineRoomFixedFoamLowExpRemarks", v)
              }
              mode="outlined"
              style={styles.input}
            />
          )}
        </>
      )}

      {/* ================= PUMP ROOM (TANKERS) ================= */}
      {payload.shipType === "TANKER" && (
        <>
          <Divider style={styles.subDivider} />
          <Text variant="titleSmall" style={styles.subTitle}>
            Pump Room (Tankers)
          </Text>

          <Checkbox.Item
            label="Fixed systems fitted in Pump Room"
            status={
              form.pumpRoomFixedAvailable ? "checked" : "unchecked"
            }
            onPress={() =>
              set(
                "pumpRoomFixedAvailable",
                !form.pumpRoomFixedAvailable
              )
            }
          />

          {form.pumpRoomFixedAvailable && (
            <>
              <Checkbox.Item
                label="Foam (High Expansion)"
                status={
                  form.pumpRoomFixedHighExpFoamAvailable
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                  set(
                    "pumpRoomFixedHighExpFoamAvailable",
                    !form.pumpRoomFixedHighExpFoamAvailable
                  )
                }
              />

              <Checkbox.Item
                label="Foam (Low Expansion)"
                status={
                  form.pumpRoomFixedLowExpFoamAvailable
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                  set(
                    "pumpRoomFixedLowExpFoamAvailable",
                    !form.pumpRoomFixedLowExpFoamAvailable
                  )
                }
              />

              <Checkbox.Item
                label="Water Spray / Drencher"
                status={
                  form.pumpRoomFixedWaterSprayAvailable
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                  set(
                    "pumpRoomFixedWaterSprayAvailable",
                    !form.pumpRoomFixedWaterSprayAvailable
                  )
                }
              />

              <Checkbox.Item
                label="CO₂ (Legacy)"
                status={
                  form.pumpRoomFixedCO2Available
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                  set(
                    "pumpRoomFixedCO2Available",
                    !form.pumpRoomFixedCO2Available
                  )
                }
              />
            </>
          )}
        </>
      )}

      {/* ================= CARGO / DECK ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Cargo Area / Deck
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Cargo Area / Deck"
        status={form.cargoFixedAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("cargoFixedAvailable", !form.cargoFixedAvailable)
        }
      />

      {form.cargoFixedAvailable && (
        <>
          <Checkbox.Item
            label="Foam (Low Expansion)"
            status={
              form.cargoFixedLowExpFoamAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "cargoFixedLowExpFoamAvailable",
                !form.cargoFixedLowExpFoamAvailable
              )
            }
          />

          <Checkbox.Item
            label="DCP (Dry Chemical Powder)"
            status={
              form.cargoFixedDCPAvailable ? "checked" : "unchecked"
            }
            onPress={() =>
              set(
                "cargoFixedDCPAvailable",
                !form.cargoFixedDCPAvailable
              )
            }
          />

          <Checkbox.Item
            label="Water Spray / Drencher"
            status={
              form.cargoFixedWaterSprayAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "cargoFixedWaterSprayAvailable",
                !form.cargoFixedWaterSprayAvailable
              )
            }
          />

          <Checkbox.Item
            label="CO₂ (Cargo Hold Flooding)"
            status={
              form.cargoFixedCO2Available
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "cargoFixedCO2Available",
                !form.cargoFixedCO2Available
              )
            }
          />
        </>
      )}

      {/* ================= ACCOMMODATION ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Accommodation
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Accommodation"
        status={
          form.accommodationFixedAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "accommodationFixedAvailable",
            !form.accommodationFixedAvailable
          )
        }
      />

      {form.accommodationFixedAvailable && (
        <>
          <Checkbox.Item
            label="Sprinkler"
            status={
              form.accommodationFixedSprinklerAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "accommodationFixedSprinklerAvailable",
                !form.accommodationFixedSprinklerAvailable
              )
            }
          />

          <Checkbox.Item
            label="Water Mist"
            status={
              form.accommodationFixedWaterMistAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "accommodationFixedWaterMistAvailable",
                !form.accommodationFixedWaterMistAvailable
              )
            }
          />
        </>
      )}

      {/* ================= GALLEY ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Galley
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Galley"
        status={
          form.galleyFixedAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "galleyFixedAvailable",
            !form.galleyFixedAvailable
          )
        }
      />

      {form.galleyFixedAvailable && (
        <>
          <Checkbox.Item
            label="Wet Chemical"
            status={
              form.galleyFixedWetChemicalAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "galleyFixedWetChemicalAvailable",
                !form.galleyFixedWetChemicalAvailable
              )
            }
          />
              <Checkbox.Item
                label="CO₂ (Dedicated galley / hood flooding)"
                status={
                    form.galleyFixedCO2Available
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                    set(
                    "galleyFixedCO2Available",
                    !form.galleyFixedCO2Available
                    )
                }
            />  


          <Checkbox.Item
            label="Water Mist"
            status={
              form.galleyFixedWaterMistAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "galleyFixedWaterMistAvailable",
                !form.galleyFixedWaterMistAvailable
              )
            }
          />
        </>
      )}

      {/* ================= PAINT LOCKER ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Paint Locker
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Paint Locker"
        status={
          form.paintLockerFixedAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "paintLockerFixedAvailable",
            !form.paintLockerFixedAvailable
          )
        }
      />

      {form.paintLockerFixedAvailable && (
        <>
          <Checkbox.Item
            label="CO₂"
            status={
              form.paintLockerFixedCO2Available
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "paintLockerFixedCO2Available",
                !form.paintLockerFixedCO2Available
              )
            }
          />

          <Checkbox.Item
            label="Water Spray / Drencher"
            status={
              form.paintLockerFixedWaterSprayAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "paintLockerFixedWaterSprayAvailable",
                !form.paintLockerFixedWaterSprayAvailable
              )
            }
          />

          <Checkbox.Item
            label="Foam (Low Expansion)"
            status={
              form.paintLockerFixedFoamAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "paintLockerFixedFoamAvailable",
                !form.paintLockerFixedFoamAvailable
              )
            }
          />
        </>
      )}

      {/* ================= CHEMICAL / FLAMMABLE LOCKER ================= */}
      <Divider style={styles.subDivider} />
      <Text variant="titleSmall" style={styles.subTitle}>
        Chemical / Flammable Locker
      </Text>

      <Checkbox.Item
        label="Fixed systems fitted in Chemical / Flammable Locker"
        status={
          form.chemicalLockerFixedAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "chemicalLockerFixedAvailable",
            !form.chemicalLockerFixedAvailable
          )
        }
      />

      {form.chemicalLockerFixedAvailable && (
        <>
          <Checkbox.Item
            label="CO₂"
            status={
              form.chemicalLockerFixedCO2Available
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "chemicalLockerFixedCO2Available",
                !form.chemicalLockerFixedCO2Available
              )
            }
          />

          <Checkbox.Item
            label="Water Spray / Drencher"
            status={
              form.chemicalLockerFixedWaterSprayAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "chemicalLockerFixedWaterSprayAvailable",
                !form.chemicalLockerFixedWaterSprayAvailable
              )
            }
          />

          <Checkbox.Item
            label="Foam (Low Expansion)"
            status={
              form.chemicalLockerFixedFoamAvailable
                ? "checked"
                : "unchecked"
            }
            onPress={() =>
              set(
                "chemicalLockerFixedFoamAvailable",
                !form.chemicalLockerFixedFoamAvailable
              )
            }
          />
        </>
      )}

      {/* ============================================================
         5) FIRE DETECTION & ALARM
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Fire Detection & Alarm
      </Text>

      <Checkbox.Item
        label="Fire detection & alarm system available"
        status={
          form.fireDetectionAlarmAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "fireDetectionAlarmAvailable",
            !form.fireDetectionAlarmAvailable
          )
        }
      />

      {form.fireDetectionAlarmAvailable && (
        <TextInput
          label="Detection type (e.g. smoke, heat, addressable)"
          value={form.detectionType}
          onChangeText={(v) => set("detectionType", v)}
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Manual call points available"
        status={
          form.manualCallPointsAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "manualCallPointsAvailable",
            !form.manualCallPointsAvailable
          )
        }
      />

      {/* ============================================================
         6) FIREMAN’S OUTFIT, BA & EEBD
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Fireman’s Outfit, BA & EEBD
      </Text>

      <Checkbox.Item
        label="Fireman’s outfit available"
        status={
          form.firemansOutfitAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "firemansOutfitAvailable",
            !form.firemansOutfitAvailable
          )
        }
      />

      {form.firemansOutfitAvailable && (
        <TextInput
          label="Number of fireman’s outfits"
          value={form.firemansOutfitSets}
          onChangeText={(v) =>
            set("firemansOutfitSets", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      <Checkbox.Item
        label="Breathing apparatus (BA) available"
        status={
          form.breathingApparatusAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "breathingApparatusAvailable",
            !form.breathingApparatusAvailable
          )
        }
      />

      {form.breathingApparatusAvailable && (
        <>
          <TextInput
            label="Number of BA sets"
            value={form.breathingApparatusSets}
            onChangeText={(v) =>
              set("breathingApparatusSets", onlyNumber(v))
            }
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Number of spare cylinders"
            value={form.spareCylindersCount}
            onChangeText={(v) =>
              set("spareCylindersCount", onlyNumber(v))
            }
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
        </>
      )}

      <Checkbox.Item
        label="EEBD available"
        status={form.eebdAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("eebdAvailable", !form.eebdAvailable)
        }
      />

      {form.eebdAvailable && (
        <TextInput
          label="Number of EEBDs"
          value={form.eebdCount}
          onChangeText={(v) =>
            set("eebdCount", onlyNumber(v))
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      {/* ============================================================
         7) FIRE CONTROL PLAN & STATIONS
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Fire Control & Stations
      </Text>

      <Checkbox.Item
        label="Fire control plan available"
        status={
          form.fireControlPlanAvailable
            ? "checked"
            : "unchecked"
        }
        onPress={() =>
          set(
            "fireControlPlanAvailable",
            !form.fireControlPlanAvailable
          )
        }
      />

      <Checkbox.Item
        label="Fire stations available"
        status={
          form.fireStationAvailable ? "checked" : "unchecked"
        }
        onPress={() =>
          set(
            "fireStationAvailable",
            !form.fireStationAvailable
          )
        }
      />

      {/* ============================================================
         8) REMARKS
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Remarks
      </Text>

      <TextInput
        label="Additional remarks (optional)"
        value={form.remarks}
        onChangeText={(v) => set("remarks", v)}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />
          </KeyboardAwareScrollView>
                <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button mode="contained" onPress={save}>
          Save Section
        </Button>
      </View>
          </View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  subDivider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    marginBottom: 12,
  },
  save: {
    marginTop: 24,
  },
  stickyBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: 12,
  borderTopWidth: 1,
},

});
