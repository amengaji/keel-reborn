//keel-mobile/src/sea-service/sections/AuxMachineryElectricalSection.tsx

/**
 * ============================================================
 * Sea Service — Auxiliary Machinery & Electrical Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture auxiliary machinery and electrical particulars
 * - Engine / ETO focused section
 *
 * UX RULES (KEEL STANDARD):
 * - Draft-safe save ALWAYS allowed (partial save)
 * - Save returns user to Sections overview (onSaved or goBack)
 * - Optional equipment must NOT block completion
 * - Custom CheckboxBox MUST be used everywhere (cross-platform safe)
 *
 * IMPORTANT DESIGN NOTE:
 * - We store ONLY relevant fields:
 *   - If an equipment checkbox is OFF, its details are not saved.
 *   - This prevents optional fields from blocking completion.
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  HelperText,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import YesNoCapsule from "../../components/common/YesNoCapsule";
import CheckboxBox from "../../components/common/CheckboxBox";
import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key constant
 */
const SECTION_KEY = "AUX_MACHINERY_ELECTRICAL";

/**
 * Helper:
 * Keep only digits (for numeric inputs that can be blank)
 */
function onlyNumber(text: string) {
  return text.replace(/[^\d]/g, "");
}

export default function AuxMachineryElectricalSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;

  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation();

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
   * LOCAL FORM STATE (UI state includes booleans + draft fields)
   * ------------------------------------------------------------
   *
   * RULE:
   * - Checkboxes indicate whether the equipment exists on board.
   * - Details fields are shown only when checkbox is ON.
   */
  const [form, setForm] = useState({
    // ---------------- GENERATORS ----------------
    mainGeneratorsFitted: false,
    mainGeneratorsMakeModel: "",
    numberOfGenerators: "",
    generatorPowerOutput: "",

    emergencyGeneratorFitted: false,
    emergencyGeneratorMakeModel: "",
    emergencyGeneratorPowerOutput: "",

    shaftGeneratorFitted: false,
    shaftGeneratorDetails: "",

    // ---------------- ELECTRICAL SUPPLY ----------------
    mainSupplyVoltageFrequency: "",
    lightingSupplyVoltage: "",

    // ---------------- BOILERS & WATER ----------------
    boilerFitted: false,
    boilerMakeType: "",
    boilerWorkingPressure: "",

    freshWaterGeneratorFitted: false,
    freshWaterGeneratorType: "",

    // ---------------- ENVIRONMENTAL ----------------
    oilyWaterSeparatorFitted: false,
    oilyWaterSeparatorMakeModel: "",

    sewageTreatmentPlantFitted: false,
    sewageTreatmentPlantMakeModel: "",

    incineratorFitted: false,
    incineratorMake: "",

    // ---------------- AIR & PURIFIERS ----------------
    purifiersFitted: false,
    purifiersMake: "",

    airCompressorsFitted: false,
    airCompressorsMakePressure: "",
  });

  /**
   * Restore draft on mount
   */
  useEffect(() => {
    if (existingData && typeof existingData === "object" && Object.keys(existingData).length > 0) {
      setForm((prev) => ({
        ...prev,

        // ✅ If a detail exists in saved data, infer fitted=true (resume-safe).
        mainGeneratorsFitted: !!existingData.mainGeneratorsFitted || !!existingData.mainGeneratorsMakeModel,
        mainGeneratorsMakeModel: existingData.mainGeneratorsMakeModel ?? "",
        numberOfGenerators: existingData.numberOfGenerators ?? "",
        generatorPowerOutput: existingData.generatorPowerOutput ?? "",

        emergencyGeneratorFitted: !!existingData.emergencyGeneratorFitted || !!existingData.emergencyGeneratorMakeModel,
        emergencyGeneratorMakeModel: existingData.emergencyGeneratorMakeModel ?? "",
        emergencyGeneratorPowerOutput: existingData.emergencyGeneratorPowerOutput ?? "",

        shaftGeneratorFitted: !!existingData.shaftGeneratorFitted || !!existingData.shaftGeneratorDetails,
        shaftGeneratorDetails: existingData.shaftGeneratorDetails ?? "",

        mainSupplyVoltageFrequency: existingData.mainSupplyVoltageFrequency ?? "",
        lightingSupplyVoltage: existingData.lightingSupplyVoltage ?? "",

        boilerFitted: !!existingData.boilerFitted || !!existingData.boilerMakeType,
        boilerMakeType: existingData.boilerMakeType ?? "",
        boilerWorkingPressure: existingData.boilerWorkingPressure ?? "",

        freshWaterGeneratorFitted: !!existingData.freshWaterGeneratorFitted || !!existingData.freshWaterGeneratorType,
        freshWaterGeneratorType: existingData.freshWaterGeneratorType ?? "",

        oilyWaterSeparatorFitted: !!existingData.oilyWaterSeparatorFitted || !!existingData.oilyWaterSeparatorMakeModel,
        oilyWaterSeparatorMakeModel: existingData.oilyWaterSeparatorMakeModel ?? "",

        sewageTreatmentPlantFitted: !!existingData.sewageTreatmentPlantFitted || !!existingData.sewageTreatmentPlantMakeModel,
        sewageTreatmentPlantMakeModel: existingData.sewageTreatmentPlantMakeModel ?? "",

        incineratorFitted: !!existingData.incineratorFitted || !!existingData.incineratorMake,
        incineratorMake: existingData.incineratorMake ?? "",

        purifiersFitted: !!existingData.purifiersFitted || !!existingData.purifiersMake,
        purifiersMake: existingData.purifiersMake ?? "",

        airCompressorsFitted: !!existingData.airCompressorsFitted || !!existingData.airCompressorsMakePressure,
        airCompressorsMakePressure: existingData.airCompressorsMakePressure ?? "",
      }));
    }
  }, []);

  /**
   * ------------------------------------------------------------
   * HELPERS — Update local state
   * ------------------------------------------------------------
   */
  const set = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * ------------------------------------------------------------
   * BUILD PAYLOAD TO SAVE (CRITICAL)
   * ------------------------------------------------------------
   *
   * RULE:
   * - If checkbox is OFF → do NOT include the detail fields.
   * - This ensures optional equipment does not block completion logic.
   */
  const payloadToSave = useMemo(() => {
    const out: Record<string, any> = {};

    // Always-save electrical supply if user provided anything (core ship electrical identity)
    if (form.mainSupplyVoltageFrequency.trim().length > 0) {
      out.mainSupplyVoltageFrequency = form.mainSupplyVoltageFrequency.trim();
    }
    if (form.lightingSupplyVoltage.trim().length > 0) {
      out.lightingSupplyVoltage = form.lightingSupplyVoltage.trim();
    }

    // Generators (fitted)
    if (form.mainGeneratorsFitted) {
      out.mainGeneratorsFitted = true;
      if (form.mainGeneratorsMakeModel.trim()) out.mainGeneratorsMakeModel = form.mainGeneratorsMakeModel.trim();
      if (form.numberOfGenerators.trim()) out.numberOfGenerators = form.numberOfGenerators.trim();
      if (form.generatorPowerOutput.trim()) out.generatorPowerOutput = form.generatorPowerOutput.trim();
    }

    if (form.emergencyGeneratorFitted) {
      out.emergencyGeneratorFitted = true;
      if (form.emergencyGeneratorMakeModel.trim()) out.emergencyGeneratorMakeModel = form.emergencyGeneratorMakeModel.trim();
      if (form.emergencyGeneratorPowerOutput.trim()) out.emergencyGeneratorPowerOutput = form.emergencyGeneratorPowerOutput.trim();
    }

    if (form.shaftGeneratorFitted) {
      out.shaftGeneratorFitted = true;
      if (form.shaftGeneratorDetails.trim()) out.shaftGeneratorDetails = form.shaftGeneratorDetails.trim();
    }

    // Boiler / FWG
    if (form.boilerFitted) {
      out.boilerFitted = true;
      if (form.boilerMakeType.trim()) out.boilerMakeType = form.boilerMakeType.trim();
      if (form.boilerWorkingPressure.trim()) out.boilerWorkingPressure = form.boilerWorkingPressure.trim();
    }

    if (form.freshWaterGeneratorFitted) {
      out.freshWaterGeneratorFitted = true;
      if (form.freshWaterGeneratorType.trim()) out.freshWaterGeneratorType = form.freshWaterGeneratorType.trim();
    }

    // Environmental
    if (form.oilyWaterSeparatorFitted) {
      out.oilyWaterSeparatorFitted = true;
      if (form.oilyWaterSeparatorMakeModel.trim()) out.oilyWaterSeparatorMakeModel = form.oilyWaterSeparatorMakeModel.trim();
    }

    if (form.sewageTreatmentPlantFitted) {
      out.sewageTreatmentPlantFitted = true;
      if (form.sewageTreatmentPlantMakeModel.trim()) out.sewageTreatmentPlantMakeModel = form.sewageTreatmentPlantMakeModel.trim();
    }

    if (form.incineratorFitted) {
      out.incineratorFitted = true;
      if (form.incineratorMake.trim()) out.incineratorMake = form.incineratorMake.trim();
    }

    // Air & purifiers
    if (form.purifiersFitted) {
      out.purifiersFitted = true;
      if (form.purifiersMake.trim()) out.purifiersMake = form.purifiersMake.trim();
    }

    if (form.airCompressorsFitted) {
      out.airCompressorsFitted = true;
      if (form.airCompressorsMakePressure.trim()) out.airCompressorsMakePressure = form.airCompressorsMakePressure.trim();
    }

    return out;
  }, [form]);

  /**
   * ------------------------------------------------------------
   * STATUS FEEDBACK ONLY (NOT HARD VALIDATION)
   * ------------------------------------------------------------
   *
   * "Complete" means: user has provided all visible required details
   * for all checked items + electrical supply fields if started.
   *
   * We do NOT block saving. We only inform the cadet.
   */
  const isSectionComplete = useMemo(() => {
    // If user checked something, require that the visible fields are filled (practical cadet standard)
    const requires = (cond: boolean, fields: string[]) =>
      !cond || fields.every((f) => f.trim().length > 0);

    const okMainGen = requires(form.mainGeneratorsFitted, [
      form.mainGeneratorsMakeModel,
      form.numberOfGenerators,
      form.generatorPowerOutput,
    ]);

    const okEmergencyGen = requires(form.emergencyGeneratorFitted, [
      form.emergencyGeneratorMakeModel,
      form.emergencyGeneratorPowerOutput,
    ]);

    const okShaftGen = requires(form.shaftGeneratorFitted, [
      form.shaftGeneratorDetails,
    ]);

    const okBoiler = requires(form.boilerFitted, [
      form.boilerMakeType,
      form.boilerWorkingPressure,
    ]);

    const okFWG = requires(form.freshWaterGeneratorFitted, [
      form.freshWaterGeneratorType,
    ]);

    const okOWS = requires(form.oilyWaterSeparatorFitted, [
      form.oilyWaterSeparatorMakeModel,
    ]);

    const okSTP = requires(form.sewageTreatmentPlantFitted, [
      form.sewageTreatmentPlantMakeModel,
    ]);

    const okInc = requires(form.incineratorFitted, [
      form.incineratorMake,
    ]);

    const okPur = requires(form.purifiersFitted, [
      form.purifiersMake,
    ]);

    const okAir = requires(form.airCompressorsFitted, [
      form.airCompressorsMakePressure,
    ]);

    // Electrical supply is treated as "core" once touched:
    // if either is started, require both for completed signal.
    const electricalTouched =
      form.mainSupplyVoltageFrequency.trim().length > 0 ||
      form.lightingSupplyVoltage.trim().length > 0;

    const okElectrical =
      !electricalTouched ||
      (form.mainSupplyVoltageFrequency.trim().length > 0 &&
        form.lightingSupplyVoltage.trim().length > 0);

    return (
      okMainGen &&
      okEmergencyGen &&
      okShaftGen &&
      okBoiler &&
      okFWG &&
      okOWS &&
      okSTP &&
      okInc &&
      okPur &&
      okAir &&
      okElectrical
    );
  }, [form]);

  /**
   * ------------------------------------------------------------
   * SAVE HANDLER
   * ------------------------------------------------------------
   */
  const handleSave = () => {
    // Draft-safe save always
    updateSection(SECTION_KEY, payloadToSave);

    // Toast feedback
    if (isSectionComplete) {
      toast.success("Aux Machinery & Electrical saved as Completed.");
    } else {
      toast.info("Saved as draft. You can complete remaining details later.");
    }

    // UX: Return to sections list
    if (onSaved) {
      onSaved();
      return;
    }

    // Fallback (in case wizard doesn't pass onSaved)
    // This keeps behavior consistent with your other sections.
    // @ts-ignore - navigation typing may be generic in your stack
    navigation.goBack();
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
          styles.content,
          { paddingBottom: 120 },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Auxiliary Machinery & Electrical
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Tick equipment that exists onboard. Enter details only for selected items.
          You can save partially and complete later.
        </Text>

        <Divider style={styles.divider} />

        {/* =====================================================
            ELECTRICAL SUPPLY (CORE)
           ===================================================== */}
        <Text style={styles.groupTitle}>Electrical Supply</Text>

        <TextInput
          label="Main Supply Voltage / Frequency (e.g., 440V / 60Hz)"
          value={form.mainSupplyVoltageFrequency}
          onChangeText={(v) => set("mainSupplyVoltageFrequency", v)}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Lighting Supply Voltage (e.g., 220V)"
          value={form.lightingSupplyVoltage}
          onChangeText={(v) => set("lightingSupplyVoltage", v)}
          mode="outlined"
          style={styles.input}
        />

        <Divider style={styles.divider} />

        {/* =====================================================
            GENERATORS
           ===================================================== */}
        <Text style={styles.groupTitle}>Generators</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Main generators fitted</Text>
          <YesNoCapsule
            value={form.mainGeneratorsFitted}
            onChange={(v) => set("mainGeneratorsFitted", v)}
          />
        </View>


        {form.mainGeneratorsFitted && (
          <>
            <TextInput
              label="Main Generators Make & Model"
              value={form.mainGeneratorsMakeModel}
              onChangeText={(v) => set("mainGeneratorsMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Number of Generators"
              value={form.numberOfGenerators}
              onChangeText={(v) => set("numberOfGenerators", onlyNumber(v))}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Generator Power Output (kW / kVA)"
              value={form.generatorPowerOutput}
              onChangeText={(v) => set("generatorPowerOutput", v)}
              mode="outlined"
              style={styles.input}
            />
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Emergency generator fitted</Text>
          <YesNoCapsule
            value={form.emergencyGeneratorFitted}
            onChange={(v) => set("emergencyGeneratorFitted", v)}
          />
        </View>


        {form.emergencyGeneratorFitted && (
          <>
            <TextInput
              label="Emergency Generator Make & Model"
              value={form.emergencyGeneratorMakeModel}
              onChangeText={(v) => set("emergencyGeneratorMakeModel", v)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Emergency Generator Power Output (kW)"
              value={form.emergencyGeneratorPowerOutput}
              onChangeText={(v) => set("emergencyGeneratorPowerOutput", v)}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </>
        )}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Shaft generator fitted</Text>
            <YesNoCapsule
              value={form.shaftGeneratorFitted}
              onChange={(v) => set("shaftGeneratorFitted", v)}
            />
          </View>


        {form.shaftGeneratorFitted && (
          <TextInput
            label="Shaft Generator Details (capacity / remarks)"
            value={form.shaftGeneratorDetails}
            onChangeText={(v) => set("shaftGeneratorDetails", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <Divider style={styles.divider} />

        {/* =====================================================
            BOILER & WATER
           ===================================================== */}
        <Text style={styles.groupTitle}>Boiler & Water</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Boiler fitted</Text>
          <YesNoCapsule
            value={form.boilerFitted}
            onChange={(v) => set("boilerFitted", v)}
          />
        </View>


        {form.boilerFitted && (
          <>
            <TextInput
              label="Boiler Make & Type"
              value={form.boilerMakeType}
              onChangeText={(v) => set("boilerMakeType", v)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Boiler Working Pressure (bar)"
              value={form.boilerWorkingPressure}
              onChangeText={(v) => set("boilerWorkingPressure", v)}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </>
        )}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fresh water generator fitted</Text>
            <YesNoCapsule
              value={form.freshWaterGeneratorFitted}
              onChange={(v) => set("freshWaterGeneratorFitted", v)}
            />
          </View>


        {form.freshWaterGeneratorFitted && (
          <TextInput
            label="Fresh Water Generator Type"
            value={form.freshWaterGeneratorType}
            onChangeText={(v) => set("freshWaterGeneratorType", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <Divider style={styles.divider} />

        {/* =====================================================
            ENVIRONMENTAL
           ===================================================== */}
        <Text style={styles.groupTitle}>Environmental Systems</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Oily Water Separator fitted</Text>
          <YesNoCapsule
            value={form.oilyWaterSeparatorFitted}
            onChange={(v) => set("oilyWaterSeparatorFitted", v)}
          />
        </View>

        {form.oilyWaterSeparatorFitted && (
          <TextInput
            label="OWS Make & Model"
            value={form.oilyWaterSeparatorMakeModel}
            onChangeText={(v) => set("oilyWaterSeparatorMakeModel", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sewage Treatment Plant fitted</Text>
          <YesNoCapsule
            value={form.sewageTreatmentPlantFitted}
            onChange={(v) => set("sewageTreatmentPlantFitted", v)}
          />
        </View>


        {form.sewageTreatmentPlantFitted && (
          <TextInput
            label="STP Make & Model"
            value={form.sewageTreatmentPlantMakeModel}
            onChangeText={(v) => set("sewageTreatmentPlantMakeModel", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Incinerator fitted</Text>
          <YesNoCapsule
            value={form.incineratorFitted}
            onChange={(v) => set("incineratorFitted", v)}
          />
        </View>

        {form.incineratorFitted && (
          <TextInput
            label="Incinerator Make"
            value={form.incineratorMake}
            onChangeText={(v) => set("incineratorMake", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <Divider style={styles.divider} />

        {/* =====================================================
            AIR & PURIFIERS
           ===================================================== */}
        <Text style={styles.groupTitle}>Air & Purifiers</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Purifiers fitted (Fuel / Lube)</Text>
          <YesNoCapsule
            value={form.purifiersFitted}
            onChange={(v) => set("purifiersFitted", v)}
          />
        </View>


        {form.purifiersFitted && (
          <TextInput
            label="Purifiers Make (Fuel / Lube)"
            value={form.purifiersMake}
            onChangeText={(v) => set("purifiersMake", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Air compressors fitted</Text>
          <YesNoCapsule
            value={form.airCompressorsFitted}
            onChange={(v) => set("airCompressorsFitted", v)}
          />
        </View>


        {form.airCompressorsFitted && (
          <TextInput
            label="Air Compressors Make & Pressure"
            value={form.airCompressorsMakePressure}
            onChangeText={(v) => set("airCompressorsMakePressure", v)}
            mode="outlined"
            style={styles.input}
          />
        )}

        {/* Feedback text (does not block saving) */}
        {!isSectionComplete && (
          <HelperText type="info" visible>
            You can save as draft. For “Completed”, fill all details for checked items.
          </HelperText>
        )}
      </KeyboardAwareScrollView>

      {/* =====================================================
          STICKY SAVE BAR (STANDARD HEIGHT)
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
    marginBottom: 8,
  },

  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },

  groupTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  divider: {
    marginBottom: 16,
  },

  input: {
    marginBottom: 12,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  checkboxLabel: {
    marginLeft: 10,
    flex: 1,
    opacity: 0.9,
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  row: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
},

rowLabel: {
  flex: 1,
  marginRight: 12,
  fontWeight: "600",
},

});
