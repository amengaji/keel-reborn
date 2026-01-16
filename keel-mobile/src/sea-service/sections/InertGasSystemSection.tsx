//keel-mobile/src/sea-service/sections/InertGasSystemSection.tsx

/**
 * ============================================================
 * Sea Service — Inert Gas System (IGS) (SUPER UX)
 * ============================================================
 *
 * DESIGN GOALS:
 * - Marine-accurate & audit-grade (SOLAS / tanker practice)
 * - Draft-safe ALWAYS (partial data allowed)
 * - Wizard controls completion/status (NOT this file)
 * - Checkbox-first UX with conditional fields to avoid clutter
 * - Standardised picks via dropdown menus
 *
 * IMPORTANT:
 * - This screen CAPTURES data only
 * - It NEVER decides Completed / In Progress (Wizard only)
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import CheckboxBox from "../../components/common/CheckboxBox";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

const SECTION_KEY = "INERT_GAS_SYSTEM";

/* ============================================================
 * Helpers
 * ============================================================ */
const onlyNumber = (v: string) => v.replace(/[^\d]/g, "");
const hasText = (v: any) => typeof v === "string" && v.trim().length > 0;

/**
 * Standardised IGS source types (marine-correct):
 * - Boiler uptake flue gas (classic IGS)
 * - Dedicated Inert Gas Generator (IGG)
 * - Nitrogen / N2 system (often on chemical / LNG; still used for inerting)
 */
const IGS_SOURCE_OPTIONS = [
  "Boiler uptake (flue gas IGS)",
  "Dedicated Inert Gas Generator (IGG)",
  "Nitrogen (N₂) inerting system",
  "Other / mixed arrangement",
] as const;

const DECK_SEAL_OPTIONS = [
  "Wet type deck water seal",
  "Dry type deck seal (or equivalent)",
  "Unknown / not sure",
] as const;

const DISTRIBUTION_OPTIONS = [
  "Cargo tanks",
  "Slop tanks",
  "Cargo line / vapor line inerting",
  "Mast riser / vent riser arrangement",
] as const;

export default function InertGasSystemSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets(); // iOS-safe sticky bar spacing
  const { payload, updateSection } = useSeaService();

  const existing =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState<any>({});

  // Menus (dropdowns)
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [deckSealMenuOpen, setDeckSealMenuOpen] = useState(false);

  /* ============================================================
   * Draft-safe initialisation
   * ============================================================ */
  useEffect(() => {
    setForm({
      /**
       * Master switches:
       * - This section can exist even for non-tankers:
       *   They can explicitly record "Not fitted".
       */
      igsFitted: existing.igsFitted ?? false,
      igsNotFittedReason: existing.igsNotFittedReason ?? "",

      /**
       * Source & capacity (recordbook-level; avoid over-engineering):
       */
      igsSourceType: existing.igsSourceType ?? "",
      igsSourceNotes: existing.igsSourceNotes ?? "",

      /**
       * Core components:
       */
      scrubberAvailable: existing.scrubberAvailable ?? false,
      blowerAvailable: existing.blowerAvailable ?? false,
      blowerCount: existing.blowerCount ?? "",
      deckSealAvailable: existing.deckSealAvailable ?? false,
      deckSealType: existing.deckSealType ?? "",
      nonReturnDevicesAvailable:
        existing.nonReturnDevicesAvailable ?? false,

      /**
       * Monitoring & control:
       */
      oxygenAnalyzerAvailable:
        existing.oxygenAnalyzerAvailable ?? false,
      oxygenLimitPercent: existing.oxygenLimitPercent ?? "8", // typical tanker limit
      igPressureAlarmAvailable:
        existing.igPressureAlarmAvailable ?? false,
      deckSealAlarmAvailable:
        existing.deckSealAlarmAvailable ?? false,
      blowerTripAvailable:
        existing.blowerTripAvailable ?? false,
      highOxygenTripAvailable:
        existing.highOxygenTripAvailable ?? false,

      /**
       * Distribution / application:
       * We store as individual booleans for clarity and audit-readability.
       */
      distCargoTanks: existing.distCargoTanks ?? false,
      distBallastTanks: existing.distBallastTanks ?? false,
      distSlopTanks: existing.distSlopTanks ?? false,
      distCargoLines: existing.distCargoLines ?? false,
      distMastRiser: existing.distMastRiser ?? false,

      /**
       * Operations / notes:
       */
      typicalOxygenPercent: existing.typicalOxygenPercent ?? "",
      operatingNotes: existing.operatingNotes ?? "",

      /**
       * General remarks:
       */
      remarks: existing.remarks ?? "",
    });
  }, []);

  const set = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  /**
   * Draft detection for user feedback:
   * - Not used for status (Wizard only)
   * - Only used to tailor toast message.
   */
  const hasAnyData = useMemo(() => {
    return Object.values(form).some((v) => {
      const s = String(v ?? "").trim();
      return s !== "" && s !== "false";
    });
  }, [form]);

  const shipType = payload?.shipType || "";
  const isLikelyTanker =
    shipType === "TANKER" ||
    shipType === "OIL_TANKER" ||
    shipType === "PRODUCT_TANKER" ||
    shipType === "CHEMICAL_TANKER";

  const save = () => {
    updateSection(SECTION_KEY, form);

    toast.info(
      hasAnyData
        ? "Inert Gas System saved."
        : "Inert Gas System saved (empty draft)."
    );

    /**
     * ============================================================
     * UX RULE (GLOBAL – ALREADY APPROVED):
     * After saving a section, ALWAYS return to Sections overview
     * ============================================================
     */
    if (onSaved) {
      onSaved();
    }
  };


  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
        {
          /**
           * IMPORTANT (iOS + Android):
           * Reserve space so the absolute sticky bar does NOT hide fields.
           */
          paddingBottom: 140 + Math.max(insets.bottom, 12),
        },
      ]}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={80}
      showsVerticalScrollIndicator={false}
    >

      <Text variant="headlineSmall" style={styles.title}>
        Inert Gas System (IGS)
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Record IGS/IGG/N₂ inerting arrangements where fitted. Save anytime —
        partial entries are acceptable.
      </Text>

      {/* ============================================================
         0) CONTEXT NOTE (non-blocking)
         ============================================================ */}
      <Divider style={styles.divider} />
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Training note</Text>
        <Text style={styles.noteText}>
          IGS is typically fitted on tankers to maintain cargo tanks in a safe
          non-flammable atmosphere. For non-tankers, you may record “Not fitted”.
        </Text>
        {hasText(shipType) && (
          <Text style={styles.noteText}>
            Current ship type: <Text style={{ fontWeight: "700" }}>{shipType}</Text>
          </Text>
        )}
      </View>

      {/* ============================================================
         1) FITTED / NOT FITTED (master switch)
         ============================================================ */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Installation
      </Text>

      <View style={styles.checkboxRow}>
        <CheckboxBox
          checked={form.igsFitted}
          onPress={() => set("igsFitted", !form.igsFitted)}
        />
        <Text style={styles.checkboxLabel}>
          IGS / inerting system fitted onboard
        </Text>
      </View>


      {!form.igsFitted && (
        <>
          <Text variant="bodySmall" style={{ opacity: 0.8, marginBottom: 8 }}>
            If not fitted, record a short reason (e.g., non-tanker / not required).
          </Text>

          <TextInput
            label="If not fitted — reason / note"
            value={form.igsNotFittedReason}
            onChangeText={(v) => set("igsNotFittedReason", v)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          {/* Helpful quick-toggle for common case */}
          {!hasText(form.igsNotFittedReason) && !isLikelyTanker && (
            <Button
              mode="outlined"
              onPress={() =>
                set(
                  "igsNotFittedReason",
                  "Not fitted (non-tanker / inert gas system not required for this ship type)."
                )
              }
              style={{ marginBottom: 8 }}
            >
              Autofill common reason
            </Button>
          )}
        </>
      )}

      {/* If NOT fitted, we still allow saving. We simply hide the remaining detailed fields. */}
      {form.igsFitted && (
        <>
          {/* ============================================================
             2) SOURCE / TYPE
             ============================================================ */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Source / Type
          </Text>

          <Menu
            visible={sourceMenuOpen}
            onDismiss={() => setSourceMenuOpen(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSourceMenuOpen(true)}
                style={styles.menuButton}
              >
                {hasText(form.igsSourceType)
                  ? `Source: ${form.igsSourceType}`
                  : "Select IGS source type"}
              </Button>
            }
          >
            {IGS_SOURCE_OPTIONS.map((opt) => (
              <Menu.Item
                key={opt}
                title={opt}
                onPress={() => {
                  set("igsSourceType", opt);
                  setSourceMenuOpen(false);
                }}
              />
            ))}
          </Menu>

          <TextInput
            label="Source notes (optional)"
            value={form.igsSourceNotes}
            onChangeText={(v) => set("igsSourceNotes", v)}
            mode="outlined"
            style={styles.input}
          />

          {/* ============================================================
             3) CORE COMPONENTS
             ============================================================ */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Core Components
          </Text>

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.scrubberAvailable}
              onPress={() =>
                set("scrubberAvailable", !form.scrubberAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              Scrubber available
            </Text>
          </View>


          {/* <Checkbox.Item
            label="IG blowers fitted"
            status={form.blowerAvailable ? "checked" : "unchecked"}
            onPress={() =>
              set("blowerAvailable", !form.blowerAvailable)
            }
          /> */}

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.blowerAvailable}
              onPress={() =>
                set("blowerAvailable", !form.blowerAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              Blower available
            </Text>
          </View>
          {form.blowerAvailable && (
            <>
              <Text
                variant="bodySmall"
                style={{ opacity: 0.8, marginBottom: 8 }}
              >
                Enter number of IGS blowers fitted onboard.
              </Text>

              <TextInput
                label="Number of IGS blowers"
                value={String(form.blowerCount ?? "")}
                onChangeText={(v) =>
                  set("blowerCount", onlyNumber(v))
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            </>
          )}



          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.deckSealAvailable}
              onPress={() =>
                set("deckSealAvailable", !form.deckSealAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              Deck seal available
            </Text>
          </View>


          {form.deckSealAvailable && (
            <>
              <Menu
                visible={deckSealMenuOpen}
                onDismiss={() => setDeckSealMenuOpen(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setDeckSealMenuOpen(true)}
                    style={styles.menuButton}
                  >
                    {hasText(form.deckSealType)
                      ? `Deck seal: ${form.deckSealType}`
                      : "Select deck seal type"}
                  </Button>
                }
              >
                {DECK_SEAL_OPTIONS.map((opt) => (
                  <Menu.Item
                    key={opt}
                    title={opt}
                    onPress={() => {
                      set("deckSealType", opt);
                      setDeckSealMenuOpen(false);
                    }}
                  />
                ))}
              </Menu>
            </>
          )}
        <View style={styles.checkboxRow}>
          <CheckboxBox
            checked={form.nonReturnDevicesAvailable}
            onPress={() =>
              set("nonReturnDevicesAvailable", !form.nonReturnDevicesAvailable)
            }
          />
          <Text style={styles.checkboxLabel}>
            Non-return devices fitted (e.g., NRV + deck seal arrangement)
          </Text>
        </View>


          {/* ============================================================
             4) MONITORING, ALARMS & TRIPS
             ============================================================ */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Monitoring, Alarms & Trips
          </Text>

        <View style={styles.checkboxRow}>
          <CheckboxBox
            checked={form.oxygenAnalyzerAvailable}
            onPress={() =>
              set("oxygenAnalyzerAvailable", !form.oxygenAnalyzerAvailable)
            }
          />
          <Text style={styles.checkboxLabel}>
            Oxygen analyzer available
          </Text>
        </View>


          {form.oxygenAnalyzerAvailable && (
            <>
              <Text variant="bodySmall" style={{ opacity: 0.8, marginBottom: 8 }}>
                Typical tanker requirement: delivered inert gas O₂ content kept low
                (commonly ≤ 8%). Record the setpoint/limit used onboard.
              </Text>

              <TextInput
                label="O₂ limit / setpoint (%)"
                value={String(form.oxygenLimitPercent ?? "")}
                onChangeText={(v) =>
                  set("oxygenLimitPercent", onlyNumber(v))
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            </>
          )}

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.igPressureAlarmAvailable}
              onPress={() =>
                set("igPressureAlarmAvailable", !form.igPressureAlarmAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              IG pressure alarm available
            </Text>
          </View>


          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.deckSealAlarmAvailable}
              onPress={() =>
                set("deckSealAlarmAvailable", !form.deckSealAlarmAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              Deck seal alarm provided
            </Text>
          </View>


          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.blowerTripAvailable}
              onPress={() =>
                set("blowerTripAvailable", !form.blowerTripAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              Blower trip provided
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.highOxygenTripAvailable}
              onPress={() =>
                set("highOxygenTripAvailable", !form.highOxygenTripAvailable)
              }
            />
            <Text style={styles.checkboxLabel}>
              High O₂ trip / shutdown available
            </Text>
          </View>



          {/* ============================================================
             5) DISTRIBUTION / APPLICATION
             ============================================================ */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Distribution / Application
          </Text>

          <Text variant="bodySmall" style={{ opacity: 0.8, marginBottom: 8 }}>
            Select where inert gas is distributed/used onboard.
          </Text>

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.distCargoTanks}
              onPress={() =>
                set("distCargoTanks", !form.distCargoTanks)
              }
            />
            <Text style={styles.checkboxLabel}>
              Distribution to cargo tanks
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.distBallastTanks}
              onPress={() =>
                set("distBallastTanks", !form.distBallastTanks)
              }
            />
            <Text style={styles.checkboxLabel}>
              Ballast tanks
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.distSlopTanks}
              onPress={() =>
                set("distSlopTanks", !form.distSlopTanks)
              }
            />
            <Text style={styles.checkboxLabel}>
              Slop Tanks
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.distCargoLines}
              onPress={() =>
                set("distCargoLines", !form.distCargoLines)
              }
            />
            <Text style={styles.checkboxLabel}>
              Cargo line / vapor line inerting
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <CheckboxBox
              checked={form.distMastRiser}
              onPress={() =>
                set("distMastRiser", !form.distMastRiser)
              }
            />
            <Text style={styles.checkboxLabel}>
              Mast riser / vent riser arrangement
            </Text>
          </View>


          {/* ============================================================
             6) OPERATING NOTES
             ============================================================ */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Operating Notes (Optional)
          </Text>

          <TextInput
            label="Typical delivered O₂ (%) during operation (optional)"
            value={form.typicalOxygenPercent}
            onChangeText={(v) =>
              set("typicalOxygenPercent", onlyNumber(v))
            }
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Operating notes (optional)"
            value={form.operatingNotes}
            onChangeText={(v) => set("operatingNotes", v)}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </>
      )}

      {/* ============================================================
         7) REMARKS + SAVE
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

          /**
           * IMPORTANT:
           * Ensure sticky bar clears iOS home indicator area.
           */
          paddingBottom: Math.max(insets.bottom, 12),
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
  container: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: "700", marginBottom: 4 },
  subtitle: { opacity: 0.8, marginBottom: 8 },

  divider: { marginVertical: 16 },

  sectionTitle: { fontWeight: "700", marginBottom: 4 },

  input: { marginBottom: 12 },
  textArea: { marginBottom: 12 },

  menuButton: { marginBottom: 12, alignSelf: "flex-start" },

  noteCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.25)",
  },

  checkboxRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
},

checkboxLabel: {
  marginLeft: 12,
  flex: 1,
},

  noteTitle: { fontWeight: "700", marginBottom: 4 },
  noteText: { opacity: 0.85, marginBottom: 4 },

  save: { marginTop: 16 },

  stickyBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,

  /**
   * PaddingBottom is set dynamically using safe-area insets (above),
   * so here we keep only base padding.
   */
  paddingHorizontal: 12,
  paddingTop: 12,
  borderTopWidth: 1,
},


});
