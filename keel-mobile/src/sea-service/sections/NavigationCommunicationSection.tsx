//keel-mobile/src/sea-service/sections/NavigationCommunicationSection.tsx

/**
 * ============================================================
 * Sea Service — Navigation & Communication Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture bridge navigation + communications equipment details
 * - Use modern UI controls (toggles, checkboxes, segmented buttons)
 * - Keep UX clean: show Make/Model fields ONLY if "Fitted" is enabled
 *
 * DESIGN RULES (CRITICAL):
 * - Draft-safe: partial save ALWAYS allowed (no blocking validation)
 * - Completion is decided ONLY in SeaServiceWizard (not here)
 * - Keyboard-safe on Android & iOS (KeyboardAwareScrollView)
 * - Light/Dark mode via react-native-paper theme
 *
 * STORAGE:
 * - All values saved under payload.sections["NAVIGATION_COMMUNICATION"]
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  HelperText,
  useTheme,
  Switch,
  Checkbox,
  SegmentedButtons,
  Card,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key used by SeaServiceWizard
 * (must match SeaServiceSectionKey: "NAVIGATION_COMMUNICATION")
 */
const SECTION_KEY = "NAVIGATION_COMMUNICATION";

/**
 * ------------------------------------------------------------
 * Types (local to this section file)
 * ------------------------------------------------------------
 * We store everything as simple primitives so the DB JSON remains stable.
 */
type GmdssArea = "A1" | "A2" | "A3" | "A4" | "";

/**
 * Minimal helper: safe string normalize.
 * - Ensures TextInput never receives undefined/null
 */
function toStr(v: unknown): string {
  return String(v ?? "");
}

/**
 * Helper: treat a value as meaningful for "draft feedback"
 * (NOT completion logic; completion is handled in wizard)
 */
function isMeaningful(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return true;
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "string") return v.trim() !== "";
  return String(v).trim() !== "";
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */
export default function NavigationCommunicationSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const { payload, updateSection } = useSeaService();

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
   * Keep state explicit + flat.
   * Booleans drive conditional UI (if fitted -> show Make/Model fields)
   */
  const [form, setForm] = useState({
    // ---------------- GMDSS / COMMS ----------------
    gmdssArea: "" as GmdssArea,
    satcomFitted: false,
    satcomType: "", // VSAT / FleetBroadband / Sat-C / Other
    satcomProvider: "", // optional
    satcomNotes: "",

    vhfDscFitted: false,
    vhfDscMakeModel: "",
    mfHfFitted: false,
    mfHfMakeModel: "",
    navtexFitted: false,
    navtexMakeModel: "",
    handheldGmdssVhfCount: "", // numeric string for simplicity
    handheldGmdssVhfMake: "",

    // ---------------- RADAR ----------------
    radarXBandFitted: false,
    radarXBandMakeModel: "",
    radarSBandFitted: false,
    radarSBandMakeModel: "",
    radarArpaFitted: false, // common audit item
    radarArpaNotes: "",

    // ---------------- ECDIS ----------------
    ecdisPrimaryFitted: false,
    ecdisPrimaryMakeModel: "",
    ecdisBackupFitted: false,
    ecdisBackupMakeModel: "",
    ecdisChartsType: "", // ENCs / RNCs / Mixed / Other
    ecdisNotes: "",

    // ---------------- COMPASSES / NAV SENSORS ----------------
    gyroCompassFitted: false,
    gyroMakeModel: "",
    magneticCompassFitted: false,
    magneticMakeModel: "",
    autopilotFitted: false,
    autopilotMakeModel: "",
    rateOfTurnIndicatorFitted: false,
    rotMakeModel: "",

    // ---------------- POSITION / SPEED / DEPTH ----------------
    gpsFitted: false,
    gpsMakeModel: "",
    speedLogFitted: false,
    speedLogType: "", // Doppler / EM / Other
    speedLogMakeModel: "",
    echoSounderFitted: false,
    echoSounderMakeModel: "",

    // ---------------- RECORDING / TRACKING ----------------
    vdrFitted: false,
    vdrType: "", // VDR / S-VDR
    vdrMakeModel: "",
    aisFitted: false,
    aisMakeModel: "",

    // ---------------- BRIDGE WATCH SUPPORT ----------------
    bnwmsFitted: false, // Bridge Navigational Watch Alarm System
    bnwmsMakeModel: "",
    eblVrmsFitted: false, // EBL/VRM capability often part of radar, but we track as a yes/no
    bridgeNotes: "", // freeform remarks
  });

  /**
   * Initialize form from existing draft once.
   * NOTE: We use a full explicit mapping to avoid missing fields.
   */
  useEffect(() => {
    const d: any = existingData ?? {};

    setForm({
      // ---------------- GMDSS / COMMS ----------------
      gmdssArea: (d.gmdssArea ?? "") as GmdssArea,
      satcomFitted: Boolean(d.satcomFitted),
      satcomType: toStr(d.satcomType),
      satcomProvider: toStr(d.satcomProvider),
      satcomNotes: toStr(d.satcomNotes),

      vhfDscFitted: Boolean(d.vhfDscFitted),
      vhfDscMakeModel: toStr(d.vhfDscMakeModel),
      mfHfFitted: Boolean(d.mfHfFitted),
      mfHfMakeModel: toStr(d.mfHfMakeModel),
      navtexFitted: Boolean(d.navtexFitted),
      navtexMakeModel: toStr(d.navtexMakeModel),
      handheldGmdssVhfCount: toStr(d.handheldGmdssVhfCount),
      handheldGmdssVhfMake: toStr(d.handheldGmdssVhfMake),

      // ---------------- RADAR ----------------
      radarXBandFitted: Boolean(d.radarXBandFitted),
      radarXBandMakeModel: toStr(d.radarXBandMakeModel),
      radarSBandFitted: Boolean(d.radarSBandFitted),
      radarSBandMakeModel: toStr(d.radarSBandMakeModel),
      radarArpaFitted: Boolean(d.radarArpaFitted),
      radarArpaNotes: toStr(d.radarArpaNotes),

      // ---------------- ECDIS ----------------
      ecdisPrimaryFitted: Boolean(d.ecdisPrimaryFitted),
      ecdisPrimaryMakeModel: toStr(d.ecdisPrimaryMakeModel),
      ecdisBackupFitted: Boolean(d.ecdisBackupFitted),
      ecdisBackupMakeModel: toStr(d.ecdisBackupMakeModel),
      ecdisChartsType: toStr(d.ecdisChartsType),
      ecdisNotes: toStr(d.ecdisNotes),

      // ---------------- COMPASSES / NAV SENSORS ----------------
      gyroCompassFitted: Boolean(d.gyroCompassFitted),
      gyroMakeModel: toStr(d.gyroMakeModel),
      magneticCompassFitted: Boolean(d.magneticCompassFitted),
      magneticMakeModel: toStr(d.magneticMakeModel),
      autopilotFitted: Boolean(d.autopilotFitted),
      autopilotMakeModel: toStr(d.autopilotMakeModel),
      rateOfTurnIndicatorFitted: Boolean(d.rateOfTurnIndicatorFitted),
      rotMakeModel: toStr(d.rotMakeModel),

      // ---------------- POSITION / SPEED / DEPTH ----------------
      gpsFitted: Boolean(d.gpsFitted),
      gpsMakeModel: toStr(d.gpsMakeModel),
      speedLogFitted: Boolean(d.speedLogFitted),
      speedLogType: toStr(d.speedLogType),
      speedLogMakeModel: toStr(d.speedLogMakeModel),
      echoSounderFitted: Boolean(d.echoSounderFitted),
      echoSounderMakeModel: toStr(d.echoSounderMakeModel),

      // ---------------- RECORDING / TRACKING ----------------
      vdrFitted: Boolean(d.vdrFitted),
      vdrType: toStr(d.vdrType),
      vdrMakeModel: toStr(d.vdrMakeModel),
      aisFitted: Boolean(d.aisFitted),
      aisMakeModel: toStr(d.aisMakeModel),

      // ---------------- BRIDGE WATCH SUPPORT ----------------
      bnwmsFitted: Boolean(d.bnwmsFitted),
      bnwmsMakeModel: toStr(d.bnwmsMakeModel),
      eblVrmsFitted: Boolean(d.eblVrmsFitted),
      bridgeNotes: toStr(d.bridgeNotes),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ------------------------------------------------------------
   * Generic field setter helpers
   * ------------------------------------------------------------
   */
  const setText = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setBool = (key: keyof typeof form, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * ------------------------------------------------------------
   * Draft feedback only (NOT completion)
   * ------------------------------------------------------------
   */
  const hasAnyMeaningfulValues = useMemo(() => {
    return Object.values(form).some(isMeaningful);
  }, [form]);

  /**
   * ------------------------------------------------------------
   * SAVE (draft-safe)
   * ------------------------------------------------------------
   * IMPORTANT:
   * - Never block saves
   * - Wizard decides Completed / In Progress / Not Started
   */
  const handleSave = () => {
    /**
     * ============================================================
     * Draft-safe save (partial allowed)
     * ============================================================
     *
     * - Never block save
     * - Completion decided centrally in SeaServiceWizard
     */
    updateSection(SECTION_KEY, form);

    if (!hasAnyMeaningfulValues) {
      toast.info("Saved as draft. You can complete this section later.");
    } else {
      toast.info(
        "Saved as draft. Complete all required equipment to mark this section as Completed."
      );
    }

    /**
     * ============================================================
     * UX RULE:
     * After saving, ALWAYS return to Sections overview
     * ============================================================
     */
    if (onSaved) {
      onSaved();
    }
  };


  /**
   * ============================================================
   * RENDER
   * ============================================================
   */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={24}
    >
      {/* --------------------------------------------------------
          Header
         -------------------------------------------------------- */}
      <Text variant="headlineSmall" style={styles.title}>
        Navigation & Communication
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Record the bridge navigation equipment and GMDSS/communications setup.
        Toggle “Fitted” to reveal Make/Model fields where applicable.
      </Text>

      <Divider style={styles.divider} />

      {/* ======================================================
          GROUP 1 — GMDSS / Communications
         ====================================================== */}
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.groupTitle}>
            GMDSS & Communications
          </Text>

          <Text variant="bodySmall" style={styles.groupHelp}>
            Select the GMDSS sea area and mark installed systems.
          </Text>

          {/* GMDSS Area: segmented buttons = modern + minimal typing */}
          <Text style={styles.fieldLabel}>GMDSS Area</Text>
          <SegmentedButtons
            value={form.gmdssArea}
            onValueChange={(v) => setText("gmdssArea", v as GmdssArea)}
            buttons={[
              { value: "A1", label: "A1" },
              { value: "A2", label: "A2" },
              { value: "A3", label: "A3" },
              { value: "A4", label: "A4" },
            ]}
            style={styles.segmented}
          />

          {/* SATCOM */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sat-Comms fitted (VSAT / FBB / Sat-C)</Text>
            <Switch
              value={form.satcomFitted}
              onValueChange={(v) => setBool("satcomFitted", v)}
            />
          </View>

          {form.satcomFitted && (
            <View style={styles.conditionalBox}>
              <TextInput
                label="Sat-Comms Type (VSAT / FleetBroadband / Sat-C / Other)"
                value={form.satcomType}
                onChangeText={(v) => setText("satcomType", v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Provider / Network (optional)"
                value={form.satcomProvider}
                onChangeText={(v) => setText("satcomProvider", v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Sat-Comms Notes (optional)"
                value={form.satcomNotes}
                onChangeText={(v) => setText("satcomNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </View>
          )}

          {/* VHF DSC */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>VHF (DSC) fitted</Text>
            <Switch
              value={form.vhfDscFitted}
              onValueChange={(v) => setBool("vhfDscFitted", v)}
            />
          </View>
          {form.vhfDscFitted && (
            <TextInput
              label="VHF (DSC) Make / Model"
              value={form.vhfDscMakeModel}
              onChangeText={(v) => setText("vhfDscMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* MF/HF */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>MF/HF fitted</Text>
            <Switch
              value={form.mfHfFitted}
              onValueChange={(v) => setBool("mfHfFitted", v)}
            />
          </View>
          {form.mfHfFitted && (
            <TextInput
              label="MF/HF Make / Model"
              value={form.mfHfMakeModel}
              onChangeText={(v) => setText("mfHfMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* NAVTEX */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>NAVTEX fitted</Text>
            <Switch
              value={form.navtexFitted}
              onValueChange={(v) => setBool("navtexFitted", v)}
            />
          </View>
          {form.navtexFitted && (
            <TextInput
              label="NAVTEX Make / Model"
              value={form.navtexMakeModel}
              onChangeText={(v) => setText("navtexMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* Handheld VHF */}
          <TextInput
            label="GMDSS Portable VHF Count (e.g., 3)"
            value={form.handheldGmdssVhfCount}
            onChangeText={(v) => setText("handheldGmdssVhfCount", v)}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="GMDSS Portable VHF Make (optional)"
            value={form.handheldGmdssVhfMake}
            onChangeText={(v) => setText("handheldGmdssVhfMake", v)}
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      {/* ======================================================
          GROUP 2 — Radar / ARPA
         ====================================================== */}
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.groupTitle}>
            Radar & ARPA
          </Text>

          <Text variant="bodySmall" style={styles.groupHelp}>
            Most merchant vessels have X-band and often S-band. Toggle fitted units and record Make/Model.
          </Text>

          {/* X-Band */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Radar X-Band fitted</Text>
            <Switch
              value={form.radarXBandFitted}
              onValueChange={(v) => setBool("radarXBandFitted", v)}
            />
          </View>
          {form.radarXBandFitted && (
            <TextInput
              label="Radar X-Band Make / Model"
              value={form.radarXBandMakeModel}
              onChangeText={(v) => setText("radarXBandMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* S-Band */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Radar S-Band fitted</Text>
            <Switch
              value={form.radarSBandFitted}
              onValueChange={(v) => setBool("radarSBandFitted", v)}
            />
          </View>
          {form.radarSBandFitted && (
            <TextInput
              label="Radar S-Band Make / Model"
              value={form.radarSBandMakeModel}
              onChangeText={(v) => setText("radarSBandMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* ARPA */}
          <View style={styles.checkboxRow}>
            <Checkbox
              status={form.radarArpaFitted ? "checked" : "unchecked"}
              onPress={() => setBool("radarArpaFitted", !form.radarArpaFitted)}
            />
            <Text style={styles.checkboxLabel}>ARPA capability available</Text>
          </View>

          {form.radarArpaFitted && (
            <TextInput
              label="ARPA Notes (optional)"
              value={form.radarArpaNotes}
              onChangeText={(v) => setText("radarArpaNotes", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* EBL/VRM */}
          <View style={styles.checkboxRow}>
            <Checkbox
              status={form.eblVrmsFitted ? "checked" : "unchecked"}
              onPress={() => setBool("eblVrmsFitted", !form.eblVrmsFitted)}
            />
            <Text style={styles.checkboxLabel}>
              EBL/VRM tools available on radar display
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* ======================================================
          GROUP 3 — ECDIS
         ====================================================== */}
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.groupTitle}>
            ECDIS
          </Text>

          <Text variant="bodySmall" style={styles.groupHelp}>
            Record ECDIS primary/backup and chart type used onboard.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>ECDIS Primary fitted</Text>
            <Switch
              value={form.ecdisPrimaryFitted}
              onValueChange={(v) => setBool("ecdisPrimaryFitted", v)}
            />
          </View>
          {form.ecdisPrimaryFitted && (
            <TextInput
              label="ECDIS Primary Make / Model"
              value={form.ecdisPrimaryMakeModel}
              onChangeText={(v) => setText("ecdisPrimaryMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>ECDIS Backup fitted</Text>
            <Switch
              value={form.ecdisBackupFitted}
              onValueChange={(v) => setBool("ecdisBackupFitted", v)}
            />
          </View>
          {form.ecdisBackupFitted && (
            <TextInput
              label="ECDIS Backup Make / Model"
              value={form.ecdisBackupMakeModel}
              onChangeText={(v) => setText("ecdisBackupMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <TextInput
            label="Chart Type (ENC / RNC / Mixed / Other)"
            value={form.ecdisChartsType}
            onChangeText={(v) => setText("ecdisChartsType", v)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="ECDIS Notes (optional)"
            value={form.ecdisNotes}
            onChangeText={(v) => setText("ecdisNotes", v)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      {/* ======================================================
          GROUP 4 — Compasses, Autopilot, Sensors
         ====================================================== */}
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.groupTitle}>
            Compasses & Navigation Sensors
          </Text>

          <Text variant="bodySmall" style={styles.groupHelp}>
            Toggle fitted equipment and record Make/Model where applicable.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Gyro Compass fitted</Text>
            <Switch
              value={form.gyroCompassFitted}
              onValueChange={(v) => setBool("gyroCompassFitted", v)}
            />
          </View>
          {form.gyroCompassFitted && (
            <TextInput
              label="Gyro Compass Make / Model"
              value={form.gyroMakeModel}
              onChangeText={(v) => setText("gyroMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Magnetic Compass fitted</Text>
            <Switch
              value={form.magneticCompassFitted}
              onValueChange={(v) => setBool("magneticCompassFitted", v)}
            />
          </View>
          {form.magneticCompassFitted && (
            <TextInput
              label="Magnetic Compass Make / Model"
              value={form.magneticMakeModel}
              onChangeText={(v) => setText("magneticMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Auto-Pilot fitted</Text>
            <Switch
              value={form.autopilotFitted}
              onValueChange={(v) => setBool("autopilotFitted", v)}
            />
          </View>
          {form.autopilotFitted && (
            <TextInput
              label="Auto-Pilot Make / Model"
              value={form.autopilotMakeModel}
              onChangeText={(v) => setText("autopilotMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Rate of Turn Indicator fitted</Text>
            <Switch
              value={form.rateOfTurnIndicatorFitted}
              onValueChange={(v) => setBool("rateOfTurnIndicatorFitted", v)}
            />
          </View>
          {form.rateOfTurnIndicatorFitted && (
            <TextInput
              label="ROT Indicator Make / Model"
              value={form.rotMakeModel}
              onChangeText={(v) => setText("rotMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <Divider style={styles.innerDivider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>GPS fitted</Text>
            <Switch
              value={form.gpsFitted}
              onValueChange={(v) => setBool("gpsFitted", v)}
            />
          </View>
          {form.gpsFitted && (
            <TextInput
              label="GPS Make / Model"
              value={form.gpsMakeModel}
              onChangeText={(v) => setText("gpsMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Speed Log fitted</Text>
            <Switch
              value={form.speedLogFitted}
              onValueChange={(v) => setBool("speedLogFitted", v)}
            />
          </View>
          {form.speedLogFitted && (
            <View style={styles.conditionalBox}>
              <TextInput
                label="Speed Log Type (Doppler / EM / Other)"
                value={form.speedLogType}
                onChangeText={(v) => setText("speedLogType", v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Speed Log Make / Model"
                value={form.speedLogMakeModel}
                onChangeText={(v) => setText("speedLogMakeModel", v)}
                mode="outlined"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Echo Sounder fitted</Text>
            <Switch
              value={form.echoSounderFitted}
              onValueChange={(v) => setBool("echoSounderFitted", v)}
            />
          </View>
          {form.echoSounderFitted && (
            <TextInput
              label="Echo Sounder Make / Model"
              value={form.echoSounderMakeModel}
              onChangeText={(v) => setText("echoSounderMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}
        </Card.Content>
      </Card>

      {/* ======================================================
          GROUP 5 — AIS / VDR / BNWAS
         ====================================================== */}
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.groupTitle}>
            Tracking, Recording & Watch Systems
          </Text>

          <Text variant="bodySmall" style={styles.groupHelp}>
            AIS and VDR/S-VDR are common audit items. BNWAS is required on many vessels.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>AIS fitted</Text>
            <Switch
              value={form.aisFitted}
              onValueChange={(v) => setBool("aisFitted", v)}
            />
          </View>
          {form.aisFitted && (
            <TextInput
              label="AIS Make / Model"
              value={form.aisMakeModel}
              onChangeText={(v) => setText("aisMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>VDR / S-VDR fitted</Text>
            <Switch
              value={form.vdrFitted}
              onValueChange={(v) => setBool("vdrFitted", v)}
            />
          </View>

          {form.vdrFitted && (
            <View style={styles.conditionalBox}>
              <TextInput
                label="VDR Type (VDR / S-VDR)"
                value={form.vdrType}
                onChangeText={(v) => setText("vdrType", v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="VDR / S-VDR Make / Model"
                value={form.vdrMakeModel}
                onChangeText={(v) => setText("vdrMakeModel", v)}
                mode="outlined"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>BNWAS / BNWMS fitted</Text>
            <Switch
              value={form.bnwmsFitted}
              onValueChange={(v) => setBool("bnwmsFitted", v)}
            />
          </View>
          {form.bnwmsFitted && (
            <TextInput
              label="BNWAS Make / Model"
              value={form.bnwmsMakeModel}
              onChangeText={(v) => setText("bnwmsMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <TextInput
            label="Bridge Notes / Remarks (optional)"
            value={form.bridgeNotes}
            onChangeText={(v) => setText("bridgeNotes", v)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      {/* --------------------------------------------------------
          Save Footer
         -------------------------------------------------------- */}
      {!hasAnyMeaningfulValues && (
        <HelperText type="info" visible>
          Tip: You can save an empty draft and return later.
        </HelperText>
      )}
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
      {!hasAnyMeaningfulValues && (
        <HelperText type="info" visible>
          Tip: You can save an empty draft and return later.
        </HelperText>
      )}

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
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },
  divider: {
    marginBottom: 14,
  },

  groupCard: {
    marginBottom: 14,
    borderRadius: 12,
  },
  groupTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  groupHelp: {
    opacity: 0.75,
    marginBottom: 10,
  },

  fieldLabel: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  segmented: {
    marginBottom: 12,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  toggleLabel: {
    flex: 1,
    paddingRight: 12,
    fontWeight: "600",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontWeight: "600",
  },

  conditionalBox: {
    marginBottom: 8,
    paddingTop: 4,
  },

  input: {
    marginBottom: 12,
  },

  innerDivider: {
    marginVertical: 8,
  },

stickyBar: {
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 12,
  borderTopWidth: 1,
},

});
