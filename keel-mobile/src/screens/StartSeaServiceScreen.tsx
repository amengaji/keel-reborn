// keel-mobile/src/screens/StartSeaServiceScreen.tsx

/**
 * ============================================================
 * Start Sea Service Screen (EXPLICIT DRAFT CREATION)
 * ============================================================
 *
 * PURPOSE:
 * - Explicitly start a Sea Service (NO autosave magic)
 * - Step 1: Select Vessel Type (via categories)
 * - Step 2: Enter Sign-On details
 *
 * IMPORTANT:
 * - This screen is shown ONLY when no DRAFT exists
 * - Draft is created ONLY when user taps "Save & Start"
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Divider,
  TextInput,
  useTheme,
  IconButton,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainStackParamList } from "../navigation/types";
import DateInputField from "../components/inputs/DateInputField";
import { useSeaService } from "../sea-service/SeaServiceContext";

/**
 * ============================================================
 * Enable layout animation on Android (SAFE)
 * ============================================================
 */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * ============================================================
 * Slow, deliberate accordion animation (Material-safe)
 * ============================================================
 * - Slightly longer than default for clarity
 * - No bounce (professional / maritime tone)
 */
const ACCORDION_ANIMATION = {
  duration: 320,
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};


/**
 * ============================================================
 * Vessel Categories (Inspector-grade)
 * ============================================================
 */
const VESSEL_CATEGORIES = [
  {
    key: "DRY",
    title: "Dry Cargo",
    types: [
      "Bulk Carrier",
      "Container Vessel",
      "General Cargo",
      "Car Carrier (PCC / PCTC)",
      "Ro-Ro (Cargo)",
    ],
  },
  {
    key: "TANKER",
    title: "Tanker",
    types: [
      "Oil Tanker",
      "Product Tanker",
      "Chemical Tanker",
      "Gas Carrier (LNG / LPG)",
    ],
  },
  {
    key: "OFFSHORE",
    title: "Offshore",
    types: [
      "AHTS",
      "PSV",
      "OSV",
      "Cable / Pipe Layer",
      "Survey / Research Vessel",
    ],
  },
  {
    key: "PASSENGER",
    title: "Passenger",
    types: ["Passenger Ship", "Ro-Pax", "Cruise Vessel"],
  },
  {
    key: "OTHER",
    title: "Other / Special",
    types: ["Tug", "Dredger", "Heavy Lift", "Training Ship"],
  },
];

export default function StartSeaServiceScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const { startSeaServiceDraft } = useSeaService();

  const [step, setStep] = useState<1 | 2>(1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [vesselType, setVesselType] = useState<string | null>(null);

  const [signOnDate, setSignOnDate] = useState<Date | null>(null);
  const [signOnPort, setSignOnPort] = useState("");

  const canProceedStep1 = !!vesselType;
  const canSave =
    signOnDate instanceof Date &&
    !isNaN(signOnDate.getTime()) &&
    signOnPort.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Card>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Start Sea Service
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Record your joining details when you sign on to a vessel.
          </Text>

          <Divider style={{ marginVertical: 16 }} />

          {/* =====================================================
              STEP 1 — VESSEL TYPE
             ===================================================== */}
          {step === 1 && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Select Vessel Type
              </Text>

              {VESSEL_CATEGORIES.map((cat) => (
                <Card key={cat.key} style={styles.categoryCard}>
                  <Card.Content style={styles.categoryHeader}>
                    <View style={styles.categoryHeaderRow}>
                      <Text variant="titleMedium" style={styles.categoryTitle}>
                        {cat.title}
                      </Text>

                      <IconButton
                        icon={
                          expandedCategory === cat.key
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            ACCORDION_ANIMATION
                          );
                          setExpandedCategory(
                            expandedCategory === cat.key ? null : cat.key
                          );
                        }}
                      />
                    </View>
                  </Card.Content>

                  {expandedCategory === cat.key && (
                    <Card.Content style={styles.categoryContent}>
                      {cat.types.map((type) => (
                        <Button
                          key={type}
                          mode={
                            vesselType === type ? "contained" : "outlined"
                          }
                          compact
                          contentStyle={{ height: 36 }}
                          icon={
                            vesselType === type
                              ? "check-circle-outline"
                              : undefined
                          }
                          style={styles.choiceButton}
                          onPress={() => {
                            LayoutAnimation.configureNext(
                              ACCORDION_ANIMATION
                            );
                            setVesselType(type);
                            setExpandedCategory(null);
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </Card.Content>
                  )}
                </Card>
              ))}

              <Button
                mode="contained"
                style={styles.primaryButton}
                disabled={!canProceedStep1}
                onPress={() => setStep(2)}
              >
                Next
              </Button>
            </>
          )}

          {/* =====================================================
              STEP 2 — SIGN-ON DETAILS
             ===================================================== */}
          {step === 2 && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Sign-On Details
              </Text>

              <DateInputField
                label="Sign-On Date"
                value={signOnDate}
                onChange={setSignOnDate}
                required
              />

              <TextInput
                label="Sign-On Port *"
                mode="outlined"
                value={signOnPort}
                onChangeText={setSignOnPort}
                style={{ marginTop: 12 }}
              />

              <View style={styles.actionRow}>
                <Button mode="text" onPress={() => navigation.goBack()}>
                  Cancel
                </Button>

                <Button
                  mode="contained"
                  disabled={!canSave}
                  icon="check"
                  onPress={async () => {
                    if (!vesselType || !signOnDate) return;

                    const isoDate = signOnDate
                      .toISOString()
                      .slice(0, 10);

                    await startSeaServiceDraft({
                      shipType: vesselType,
                      signOnDate: isoDate,
                      signOnPort: signOnPort.trim(),
                    });

                    navigation.replace("MainTabs");
                  }}
                >
                  Save & Start Sea Service
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },

  title: {
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    opacity: 0.7,
  },

  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },

  categoryCard: {
    marginBottom: 8,
    borderRadius: 10,
  },

  categoryHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  categoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryTitle: {
    fontWeight: "600",
  },

  categoryContent: {
    paddingTop: 4,
  },

  choiceButton: {
    marginBottom: 6,
  },

  primaryButton: {
    marginTop: 16,
  },

  actionRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
