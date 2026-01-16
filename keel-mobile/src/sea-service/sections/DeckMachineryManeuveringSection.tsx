//keel-mobile/src/sea-service/sections/DeckMachineryManeuveringSection.tsx

/**
 * ============================================================
 * Sea Service — Deck Machinery & Maneuvering Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture deck machinery and maneuvering equipment details
 *
 * UX STANDARD:
 * - Scrollable content
 * - Sticky Save bar (correct height)
 * - Draft-safe save
 * - Completion handled ONLY by SeaServiceWizard
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
import YesNoCapsule from "../../components/common/YesNoCapsule";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key constant
 */
const SECTION_KEY = "DECK_MACHINERY_MANEUVERING";

export default function DeckMachineryManeuveringSection(props: { onSaved?: () => void }) {
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
    payload.sections?.[
      SECTION_KEY as keyof typeof payload.sections
    ] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   */
  const [form, setForm] = useState({
    // --- WINDLASS ---
    anchorWindlassFitted: false,
    anchorWindlassMakeType: "",

    // --- MOORING WINCHES ---
    mooringWinchesFitted: false,
    mooringWinchesNumberType: "",

    // --- ANCHORS & CHAINS ---
    anchorsAndChainsFitted: false,
    anchorPortTypeWeight: "",
    anchorStarboardTypeWeight: "",
    chainLengthPortShackles: "",
    chainLengthStarboardShackles: "",
    

    // --- THRUSTERS ---
    bowThrusterFitted: false,
    sternThrusterFitted: false,
    bowThrusterPowerMake: "",
    sternThrusterPowerMake: "",

    // --- STEERING ---
    steeringGearMakeModelType: "",
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
   * COMPLETION CHECK (STATUS ONLY)
   * ------------------------------------------------------------
   */
  const isFormComplete = useMemo(() => {
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
     *
     * - Partial entries → IN_PROGRESS
     * - Fully filled → COMPLETED
     * - Status logic handled centrally in SeaServiceContext
     */
    updateSection(SECTION_KEY, form);

    if (isFormComplete) {
      toast.success(
        "Deck machinery & maneuvering section completed."
      );
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
  };


  /**
   * ============================================================
   * RENDER
   * ============================================================
   */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* =====================================================
          SCROLLABLE CONTENT
          ===================================================== */}
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
          Deck Machinery & Maneuvering
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter deck machinery and maneuvering equipment details.
          You may save partially and complete later.
        </Text>

        <Divider style={styles.divider} />

        {/* ---------------- WINDLASS & WINCHES ---------------- */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Anchor Windlass fitted</Text>
          <YesNoCapsule
            value={form.anchorWindlassFitted}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                anchorWindlassFitted: v,
              }))
            }
          />
        </View>

        {form.anchorWindlassFitted && (
          <TextInput
            label="Anchor Windlass — Make & Type"
            value={form.anchorWindlassMakeType}
            onChangeText={(v) =>
              handleChange("anchorWindlassMakeType", v)
            }
            mode="outlined"
            style={styles.input}
          />
        )}


        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mooring Winches fitted</Text>
          <YesNoCapsule
            value={form.mooringWinchesFitted}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                mooringWinchesFitted: v,
              }))
            }
          />
        </View>

        {form.mooringWinchesFitted && (
          <TextInput
            label="Mooring Winches — Number & Type"
            value={form.mooringWinchesNumberType}
            onChangeText={(v) =>
              handleChange("mooringWinchesNumberType", v)
            }
            mode="outlined"
            style={styles.input}
          />
        )}


        {/* ---------------- ANCHORS & CHAINS ---------------- */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Anchors & Chains fitted</Text>
          <YesNoCapsule
            value={form.anchorsAndChainsFitted}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                anchorsAndChainsFitted: v,
              }))
            }
          />
        </View>

        {form.anchorsAndChainsFitted && (
          <>
            <TextInput
              label="Anchor (Port) — Type & Weight"
              value={form.anchorPortTypeWeight}
              onChangeText={(v) =>
                handleChange("anchorPortTypeWeight", v)
              }
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Anchor (Starboard) — Type & Weight"
              value={form.anchorStarboardTypeWeight}
              onChangeText={(v) =>
                handleChange("anchorStarboardTypeWeight", v)
              }
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Chain Length (Port) — Shackles"
              value={form.chainLengthPortShackles}
              onChangeText={(v) =>
                handleChange("chainLengthPortShackles", v)
              }
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Chain Length (Starboard) — Shackles"
              value={form.chainLengthStarboardShackles}
              onChangeText={(v) =>
                handleChange("chainLengthStarboardShackles", v)
              }
              mode="outlined"
              style={styles.input}
            />
          </>
        )}


        {/* ---------------- THRUSTERS ---------------- */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Bow Thruster fitted</Text>
          <YesNoCapsule
            value={form.bowThrusterFitted}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                bowThrusterFitted: v,
              }))
            }
          />
        </View>

        {form.bowThrusterFitted && (
          <TextInput
            label="Bow Thruster — Power & Make"
            value={form.bowThrusterPowerMake}
            onChangeText={(v) =>
              handleChange("bowThrusterPowerMake", v)
            }
            mode="outlined"
            style={styles.input}
          />
        )}


        <View style={styles.row}>
          <Text style={styles.rowLabel}>Stern Thruster fitted</Text>
          <YesNoCapsule
            value={form.sternThrusterFitted}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                sternThrusterFitted: v,
              }))
            }
          />
        </View>

        {form.sternThrusterFitted && (
          <TextInput
            label="Stern Thruster — Power & Make"
            value={form.sternThrusterPowerMake}
            onChangeText={(v) =>
              handleChange("sternThrusterPowerMake", v)
            }
            mode="outlined"
            style={styles.input}
          />
        )}


        {/* ---------------- STEERING GEAR ---------------- */}
        <TextInput
          label="Steering Gear — Make / Model / Type"
          value={form.steeringGearMakeModelType}
          onChangeText={(v) =>
            handleChange("steeringGearMakeModelType", v)
          }
          mode="outlined"
          style={styles.input}
        />

        {!isFormComplete && (
          <HelperText type="info" visible>
            All fields are required to mark this section as completed.
          </HelperText>
        )}
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
