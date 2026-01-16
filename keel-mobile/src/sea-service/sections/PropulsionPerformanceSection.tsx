//keel-mobile/src/sea-service/sections/PropulsionPerformanceSection.tsx

/**
 * ============================================================
 * Sea Service — Main Propulsion & Performance Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture propulsion and performance particulars
 * - Mandatory section (all fields required)
 * - Draft-safe: user can save and return anytime
 *
 * UX PATTERN (STANDARDISED):
 * - Scrollable form content
 * - Sticky Save bar at bottom (correct Android height)
 * - Keyboard-safe
 * - Toast feedback
 *
 * ⚠️ IMPORTANT:
 * This file follows the SAME sticky-bar layout as:
 * - DimensionsTonnageSection (confirmed working)
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Divider,
  HelperText,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key constant
 */
const SECTION_KEY = "PROPULSION_PERFORMANCE";

export default function PropulsionPerformanceSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * ------------------------------------------------------------
   * LOAD EXISTING DRAFT (IF ANY)
   * ------------------------------------------------------------
   */
  const existingData =
    payload.sections?.[
      SECTION_KEY as keyof typeof payload.sections
    ] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   */
  const [form, setForm] = useState({
    mainEngineMakeModel: "",
    mainEngineType: "",
    numberOfMainEngines: "",
    mcrPower: "",
    rpmAtMcr: "",
    serviceSpeedKnots: "",
    fuelTypes: "",
    dailyFuelConsumption: "",
    propellerType: "",
    numberOfPropellers: "",
    rudderType: "",
  });

  /**
   * Restore draft on mount
   */
  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      setForm((prev) => ({ ...prev, ...existingData }));
    }
  }, []);

  /**
   * ------------------------------------------------------------
   * VALIDATION — ALL FIELDS MANDATORY
   * ------------------------------------------------------------
   */
  const isFormValid = useMemo(() => {
    return Object.values(form).every(
      (value) => String(value).trim() !== ""
    );
  }, [form]);

  /**
   * ------------------------------------------------------------
   * HANDLERS
   * ------------------------------------------------------------
   */
  const handleChange = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    /**
     * ============================================================
     * Draft-safe save (partial allowed)
     * ============================================================
     */
    updateSection(SECTION_KEY, form);

    if (!isFormValid) {
      toast.info(
        "Saved as draft. Complete all fields to mark this section as Completed."
      );
    } else {
      toast.success(
        "Main propulsion & performance section completed."
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
  };



  /**
   * ============================================================
   * RENDER
   * ============================================================
   */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* =====================================================
          SCROLLABLE FORM CONTENT
          ===================================================== */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            // Reserve space for sticky save bar
            paddingBottom: 120,
          },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Main Propulsion & Performance
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter main engine and propulsion performance details.
          All fields are mandatory.
        </Text>

        <Divider style={styles.divider} />

        {/* ---------------- MAIN ENGINE ---------------- */}
        <TextInput
          label="Main Engine Make & Model"
          value={form.mainEngineMakeModel}
          onChangeText={(v) =>
            handleChange("mainEngineMakeModel", v)
          }
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Main Engine Type (2-stroke / 4-stroke)"
          value={form.mainEngineType}
          onChangeText={(v) =>
            handleChange("mainEngineType", v)
          }
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Number of Main Engines"
          value={form.numberOfMainEngines}
          onChangeText={(v) =>
            handleChange("numberOfMainEngines", v)
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Maximum Continuous Rating (kW / BHP)"
          value={form.mcrPower}
          onChangeText={(v) =>
            handleChange("mcrPower", v)
          }
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="RPM at MCR"
          value={form.rpmAtMcr}
          onChangeText={(v) =>
            handleChange("rpmAtMcr", v)
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        {/* ---------------- PERFORMANCE ---------------- */}
        <TextInput
          label="Service Speed (knots)"
          value={form.serviceSpeedKnots}
          onChangeText={(v) =>
            handleChange("serviceSpeedKnots", v)
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Fuel Type(s) (HFO / MDO / LNG / etc.)"
          value={form.fuelTypes}
          onChangeText={(v) =>
            handleChange("fuelTypes", v)
          }
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Daily Fuel Consumption (at service speed)"
          value={form.dailyFuelConsumption}
          onChangeText={(v) =>
            handleChange("dailyFuelConsumption", v)
          }
          mode="outlined"
          style={styles.input}
        />

        {/* ---------------- PROPULSION ---------------- */}
        <TextInput
          label="Propeller Type (Fixed / CPP)"
          value={form.propellerType}
          onChangeText={(v) =>
            handleChange("propellerType", v)
          }
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Number of Propellers"
          value={form.numberOfPropellers}
          onChangeText={(v) =>
            handleChange("numberOfPropellers", v)
          }
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Rudder Type (Spade / Semi-balanced / etc.)"
          value={form.rudderType}
          onChangeText={(v) =>
            handleChange("rudderType", v)
          }
          mode="outlined"
          style={styles.input}
        />

        {!isFormValid && (
          <HelperText type="info" visible>
            You can save as draft. Complete all fields to mark this section as Completed.
          </HelperText>
        )}

      </KeyboardAwareScrollView>

      {/* =====================================================
          STICKY SAVE BAR (CORRECT HEIGHT)
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
        <Button
          mode="contained"
          onPress={handleSave}
        >
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

  divider: {
    marginBottom: 16,
  },

  input: {
    marginBottom: 12,
  },

  /**
   * Sticky bottom bar
   * - Height intentionally minimal
   * - Same as Dimensions & Tonnages
   */
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
