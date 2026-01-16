//keel-mobile/src/sea-service/SeaServiceWizard.tsx

/**
 * ============================================================
 * Sea Service Wizard
 * ============================================================
 *
 * STEP 1: Ship Type Selection
 * STEP 2: Section Overview (filtered by ship type)
 * STEP 3+: Section Form Screens (one at a time)
 *
 * NOTE:
 * - Internal state-based navigation is used instead of
 *   global stack navigation for stability.
 * - Each section screen is independent and draft-safe.
 *
 * ANDROID NOTE:
 * - Android system navigation bar (Back / Home / Recents)
 *   can overlap full-screen views.
 * - SafeAreaInsets alone is NOT sufficient.
 * - We explicitly reserve footer space.
 */

import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, Card, Button, useTheme, Divider, Searchbar, Chip, RadioButton, TextInput} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SHIP_TYPES } from "../config/shipTypes";
import { SEA_SERVICE_SECTIONS } from "../config/seaServiceSections";
import { useSeaService } from "./SeaServiceContext";
import { useToast } from "../components/toast/useToast";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { finalizeSeaService } from "../db/seaService";
import { Dialog, Portal } from "react-native-paper";
import DateInputField from "../components/inputs/DateInputField";
import { canFinalizeSeaService } from "./seaServiceStatus";


import PropulsionPerformanceSection from "./sections/PropulsionPerformanceSection";
import GeneralIdentitySection from "./sections/GeneralIdentitySection";
import DimensionsTonnageSection from "./sections/DimensionsTonnageSection";
import AuxMachineryElectricalSection from "./sections/AuxMachineryElectricalSection";
import DeckMachineryManeuveringSection from "./sections/DeckMachineryManeuveringSection";
import CargoCapabilitiesSection from "./sections/CargoCapabilitiesSection";
import NavigationCommunicationSection from "./sections/NavigationCommunicationSection";
import LifeSavingAppliancesSection from "./sections/LifeSavingAppliancesSection";
import FireFightingAppliancesSection from "./sections/FireFightingAppliancesSection";
import InertGasSystemSection from "./sections/InertGasSystemSection";
import PollutionPreventionSection from "./sections/PollutionPreventionSection";

/**
 * Wizard steps currently implemented.
 */
type WizardStep =
  | "SHIP_TYPE"
  | "SERVICE_PERIOD"
  | "SECTION_OVERVIEW"
  | "GENERAL_IDENTITY"
  | "DIMENSIONS_TONNAGE"
  | "PROPULSION_PERFORMANCE"
  | "AUX_MACHINERY_ELECTRICAL"
  | "DECK_MACHINERY_MANEUVERING"
  | "CARGO_CAPABILITIES"
  | "NAVIGATION_COMMUNICATION"
  | "LIFE_SAVING_APPLIANCES"
  | "FIRE_FIGHTING_APPLIANCES"
  | "INERT_GAS_SYSTEM"
  | "POLLUTION_PREVENTION";




export default function SeaServiceWizard() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const { payload, seaServiceId, updateSection, setShipType, updateServicePeriod, } = useSeaService();

/**
 * ============================================================
 * FINALIZE ELIGIBILITY (SINGLE SOURCE OF TRUTH)
 * ============================================================
 *
 * Rules:
 * - Cadet MUST have signed on
 * - ALL sections must be COMPLETE
 * - Sign-off is NOT required
 */
const canFinalize = (() => {
  const period = payload.servicePeriod;

  // Sign-on is mandatory
  if (!period?.signOnDate) return false;

  const statuses = payload.sectionStatus;

  if (!statuses) return false;

  // Every defined section must be COMPLETE
  return (Object.keys(payload.sections) as Array<
    keyof typeof payload.sections
  >).every((key) => statuses[key] === "COMPLETE");
})();


/**
 * FINAL records are read-only.
 * UI must reflect this clearly.
 */
const isReadOnly = !canFinalize && payload?.servicePeriod?.signOffDate !== null;

/**
 * ============================================================
 * Internal wizard step state (HARD LOCKED)
 * ============================================================
 *
 * RULE (ABSOLUTE):
 * - Ship type is selected ONLY during draft creation
 * - Wizard MUST NEVER remain in SHIP_TYPE state
 */
const [currentStep, setCurrentStep] = useState<WizardStep>("SECTION_OVERVIEW");

/**
 * ============================================================
 * FOCUS RESTORE — ALWAYS RETURN TO SECTION OVERVIEW
 * ============================================================
 *
 * UX RULE (CRITICAL):
 * - When a section screen is closed (goBack),
 *   the wizard MUST reopen on Section Overview
 * - This ensures section status + progress refresh correctly
 */
useFocusEffect(
  React.useCallback(() => {
    setCurrentStep("SECTION_OVERVIEW");
  }, [])
);


  /**
   * ------------------------------------------------------------
   * ANDROID SYSTEM FOOTER SAFETY
   * ------------------------------------------------------------
   *
   * Why this exists:
   * - Android bottom navigation bar height is NOT guaranteed
   *   to be part of safe-area insets.
   * - We explicitly reserve space so content never overlaps.
   *
   * Rule:
   * - Always keep this applied to ScrollViews and section screens.
   */
  const androidSystemFooterPadding =
    Math.max(insets.bottom, 16) + 48;

  /**
   * ------------------------------------------------------------
   * STEP 1: Ship Type
   * ------------------------------------------------------------
   */
  const handleSelectShipType = (
    shipTypeCode: string,
    label: string
  ) => {
    setShipType(shipTypeCode);
    toast.success(
      `Ship type set to "${label}". Draft saved.`
    );
  };

  const handleNextFromShipType = () => {
    if (!payload.shipType) {
      toast.error("Please select a ship type first.");
      return;
    }
    setCurrentStep("SERVICE_PERIOD");
  };

    // ------------------------------------------------------------
    // Service Period (local draft state)
    // ------------------------------------------------------------
  const [signOnDate, setSignOnDate] = useState<Date | null>(
    payload.servicePeriod?.signOnDate ?? null
  );

  const [signOffDate, setSignOffDate] = useState<Date | null>(
    payload.servicePeriod?.signOffDate ?? null
  );

  const [signOnPort, setSignOnPort] = useState(
    payload.servicePeriod?.signOnPort ?? ""
  );

  const [signOffPort, setSignOffPort] = useState(
    payload.servicePeriod?.signOffPort ?? ""
  );



    /**
     * ------------------------------------------------------------
     * STEP 1 UX — SEARCH + CATEGORY FILTERING
     * ------------------------------------------------------------
     * Why:
     * - Ship type lists will grow (company fleets vary).
     * - Cadets must find their ship type quickly, even offline.
     * - We keep config unchanged; is derived locally.
     */

    type ShipTypeCategory =
      | "ALL"
      | "CARGO"
      | "TANKER"
      | "PASSENGER"
      | "OFFSHORE"
      | "OTHER";

    const [shipTypeSearch, setShipTypeSearch] = useState<string>("");
    const [shipTypeCategory, setShipTypeCategory] =
      useState<ShipTypeCategory>("ALL");

    const deriveShipTypeCategory = (code: string, label: string): ShipTypeCategory => {
      const c = (code ?? "").toUpperCase();
      const l = (label ?? "").toUpperCase();

      // Tankers
      if (c.includes("TANKER") || l.includes("TANKER")) return "TANKER";

      // Passenger
      if (c.includes("PASSENGER") || l.includes("PASSENGER")) return "PASSENGER";

      // Offshore / support
      if (c.includes("AHTS") || l.includes("TUG") || l.includes("SUPPLY")) return "OFFSHORE";

      // Cargo family (common cadet use)
      if (
        c.includes("CARGO") ||
        c.includes("BULK") ||
        c.includes("CONTAINER") ||
        c.includes("RO_RO") ||
        c.includes("CAR")
      ) {
        return "CARGO";
      }

      return "OTHER";
    };

    const filteredShipTypes = useMemo(() => {
      const q = shipTypeSearch.trim().toLowerCase();

      return SHIP_TYPES.filter((s) => {
        const cat = deriveShipTypeCategory(s.code, s.label);

        const matchesCategory =
          shipTypeCategory === "ALL" ? true : cat === shipTypeCategory;

        const matchesSearch =
          q.length === 0
            ? true
            : s.label.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      });
    }, [shipTypeSearch, shipTypeCategory]);

    const selectedShipType = useMemo(() => {
      if (!payload.shipType) return null;
      return SHIP_TYPES.find((s) => s.code === payload.shipType) ?? null;
    }, [payload.shipType]);

    const quickPickCodes = useMemo(() => {
      // Quick picks: chosen for typical cadet deployments + fastest selection
      return ["CONTAINER", "BULK_CARRIER", "OIL_TANKER", "CHEMICAL_TANKER"];
    }, []);

    const quickPicks = useMemo(() => {
      return SHIP_TYPES.filter((s) => quickPickCodes.includes(s.code));
    }, [quickPickCodes]);

/**
 * ============================================================
 * SECTION ENABLEMENT (UX-SAFE FALLBACK)
 * ============================================================
 *
 * IMPORTANT:
 * - If section configuration is missing or mismatched,
 *   we FALL BACK to showing ALL sections.
 * - This prevents a dead UI for cadets.
 */
const enabledSections = useMemo(() => {
  if (!payload.shipType) return [];

  const shipTypeConfig = SHIP_TYPES.find(
    (t) => t.code === payload.shipType
  );

  // Fallback: show all sections if config is missing
if (!shipTypeConfig || !shipTypeConfig.enabledSections?.length) {
  const isTanker =
    payload.shipType === "TANKER" ||
    payload.shipType === "OIL_TANKER" ||
    payload.shipType === "PRODUCT_TANKER" ||
    payload.shipType === "CHEMICAL_TANKER";

  return SEA_SERVICE_SECTIONS.filter(
    (s) => s.key !== "INERT_GAS_SYSTEM" || isTanker
  );
}
// Determine if the ship is a tanker for IGS visibility

const isTanker =
  payload.shipType === "TANKER" ||
  payload.shipType === "OIL_TANKER" ||
  payload.shipType === "PRODUCT_TANKER" ||
  payload.shipType === "CHEMICAL_TANKER";

/**
 * ============================================================
 * HARD VISIBILITY RULE — IGS
 * ============================================================
 *
 * - IGS must NEVER be visible for non-tankers
 * - No fallback is allowed for this rule
 * - This is PSC / audit mandatory behaviour
 */
const filtered = SEA_SERVICE_SECTIONS.filter((section) => {
  if (section.key === "INERT_GAS_SYSTEM" && !isTanker) {
    return false;
  }

  return shipTypeConfig.enabledSections.includes(section.key);
});

return filtered;

}, [payload.shipType]);

/**
 * ============================================================
 * SECTION STATUS + PROGRESS (UI helpers)
 * ============================================================
 *
 * We show status on each section card so cadets can:
 * - verify completion at a glance
 * - continue the next section without guessing
 */
const completedSectionsCount = useMemo(() => {
  const statuses: any = (payload as any)?.sectionStatus ?? {};
  return enabledSections.filter((s) => statuses[s.key] === "COMPLETE").length;
}, [enabledSections, payload]);

const totalSectionsCount = enabledSections.length;

const getSectionStatusLabel = (status?: string) => {
  if (status === "COMPLETE") return "Completed";
  return "Not Started";
};

  /**
   * ------------------------------------------------------------
   * SECTION OPEN HANDLER
   * ------------------------------------------------------------
   */
  const handleOpenSection = (
    sectionKey: string,
    title: string
  ) => {
    if (sectionKey === "GENERAL_IDENTITY") {
      setCurrentStep("GENERAL_IDENTITY");
      return;
    }

    if (sectionKey === "DIMENSIONS_TONNAGE") {
      setCurrentStep("DIMENSIONS_TONNAGE");
      return;
    }

    if (sectionKey === "PROPULSION_PERFORMANCE") {
    setCurrentStep("PROPULSION_PERFORMANCE");
    return;
    }
    
    if (sectionKey === "AUX_MACHINERY_ELECTRICAL") {
    setCurrentStep("AUX_MACHINERY_ELECTRICAL");
    return;
    }

    if (sectionKey === "DECK_MACHINERY_MANEUVERING") {
    setCurrentStep("DECK_MACHINERY_MANEUVERING");
    return;
    }
    if (sectionKey === "CARGO_CAPABILITIES") {
    setCurrentStep("CARGO_CAPABILITIES");
    return;
    }
    if (sectionKey === "NAVIGATION_COMMUNICATION") {
    setCurrentStep("NAVIGATION_COMMUNICATION");
    return;
    }
    if (sectionKey === "LIFE_SAVING_APPLIANCES") {
    setCurrentStep("LIFE_SAVING_APPLIANCES");
    return;
    }
    if (sectionKey === "FIRE_FIGHTING_APPLIANCES") {
    setCurrentStep("FIRE_FIGHTING_APPLIANCES");
    return;
    }
    if (sectionKey === "POLLUTION_PREVENTION") {
    setCurrentStep("POLLUTION_PREVENTION");
    return;
    }
    if (sectionKey === "INERT_GAS_SYSTEM") {
      const isTanker =
        payload.shipType === "TANKER" ||
        payload.shipType === "OIL_TANKER" ||
        payload.shipType === "PRODUCT_TANKER" ||
        payload.shipType === "CHEMICAL_TANKER";

      if (!isTanker) {
        toast.info("Inert Gas System is not applicable for this vessel type.");
        return;
      }

      setCurrentStep("INERT_GAS_SYSTEM");
      return;
    }

  
    toast.info(`"${title}" form will be added next.`);
  };


/**
 * ============================================================
 * RENDER — SERVICE PERIOD
 * ============================================================
 */
if (currentStep === "SERVICE_PERIOD") {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text variant="titleLarge" style={{ fontWeight: "700", marginBottom: 16 }}>
          Service Period
        </Text>

        <DateInputField
          label="Date of Sign On"
          required
          value={signOnDate}
          onChange={setSignOnDate}
        />

        <TextInput
          mode="outlined"
          label="Port of Joining *"
          value={signOnPort}
          onChangeText={setSignOnPort}
          style={{ marginTop: 12 }}
        />

        <DateInputField
          label="Date of Sign Off"
          value={signOffDate}
          onChange={setSignOffDate}
        />

        <TextInput
          mode="outlined"
          label="Port of Sign Off *"
          value={signOffPort}
          onChangeText={setSignOffPort}
          style={{ marginTop: 12 }}
        />
      </ScrollView>

      {/* =====================================================
          STICKY SAVE BAR
         ===================================================== */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Button
          mode="contained"
          style={{ flex: 1 }}
          onPress={() => {
            if (!signOnDate || !signOnPort) {
              toast.error("Please complete all service period fields.");
              return;
            }

            updateServicePeriod({
              signOnDate,
              signOnPort: signOnPort.trim(),
              signOffDate,
              signOffPort: signOffPort.trim() || null,
            });

            
            toast.success("Service period saved.");
            setCurrentStep("SECTION_OVERVIEW");
          }}
        >
          Save & Continue
        </Button>
      </View>
    </View>
  );
}

  /**
   * ============================================================
   * RENDER — STEP 3: GENERAL IDENTITY
   * ============================================================
   */
  if (currentStep === "GENERAL_IDENTITY") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Button
            mode="outlined"
            onPress={() =>
              setCurrentStep("SECTION_OVERVIEW")
            }
          >
            Back to Sections
          </Button>

          <Button
            mode="text"
            onPress={() =>
              toast.info(
                "Remember to tap Save Section before leaving."
              )
            }
          >
            Help
          </Button>
        </View>

        <Divider />

        <GeneralIdentitySection onSaved={() => setCurrentStep("SECTION_OVERVIEW")} />

      </View>
    );
  }

  /**
   * ============================================================
   * RENDER — STEP 4: DIMENSIONS & TONNAGES
   * ============================================================
   */
  if (currentStep === "DIMENSIONS_TONNAGE") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Button
            mode="outlined"
            onPress={() =>
              setCurrentStep("SECTION_OVERVIEW")
            }
          >
            Back to Sections
          </Button>

          <Button
            mode="text"
            onPress={() =>
              toast.info(
                "Remember to tap Save Section before leaving."
              )
            }
          >
            Help
          </Button>
        </View>

        <Divider />

        <DimensionsTonnageSection onSaved={() => setCurrentStep("SECTION_OVERVIEW")}/>
      </View>
    );
  }

    /**
     * ============================================================
     * RENDER — STEP 5: PROPULSION & PERFORMANCE
     * ============================================================
     */
    if (currentStep === "PROPULSION_PERFORMANCE") {
    return (
        <View
        style={[
            styles.container,
            {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
            },
        ]}
        >
        <View style={styles.sectionHeader}>
            <Button
            mode="outlined"
            onPress={() =>
                setCurrentStep("SECTION_OVERVIEW")
            }
            >
            Back to Sections
            </Button>

            <Button
            mode="text"
            onPress={() =>
                toast.info(
                "Remember to tap Save Section before leaving."
                )
            }
            >
            Help
            </Button>
        </View>

        <Divider />

        <PropulsionPerformanceSection
          onSaved={() => setCurrentStep("SECTION_OVERVIEW")}
        />

        </View>
    );
    }

    /**
     * ============================================================
     * RENDER — STEP 6: AUXILIARY MACHINERY AND ELECTRICAL
     * ============================================================
     */
    if (currentStep === "AUX_MACHINERY_ELECTRICAL") {
        return (
            <View
            style={[
                styles.container,
                {
                backgroundColor: theme.colors.background,
                paddingBottom: androidSystemFooterPadding,
                },
            ]}
            >
            <View style={styles.sectionHeader}>
                <Button
                mode="outlined"
                onPress={() =>
                    setCurrentStep("SECTION_OVERVIEW")
                }
                >
                Back to Sections
                </Button>

                <Button
                mode="text"
                onPress={() =>
                    toast.info(
                    "Remember to tap Save Section before leaving."
                    )
                }
                >
                Help
                </Button>
            </View>

            <Divider />

            <AuxMachineryElectricalSection
              onSaved={() => setCurrentStep("SECTION_OVERVIEW")}
            />

            </View>
        );
    }
    

    /**
     * ============================================================
     * RENDER — STEP 7: DECK MACHINERY & MAEUVERING
     * ============================================================
     */
    if (currentStep === "DECK_MACHINERY_MANEUVERING") {
        return (
            <View
            style={[
                styles.container,
                {
                backgroundColor: theme.colors.background,
                paddingBottom: androidSystemFooterPadding,
                },
            ]}
            >
            <View style={styles.sectionHeader}>
                <Button
                mode="outlined"
                onPress={() =>
                    setCurrentStep("SECTION_OVERVIEW")
                }
                >
                Back to Sections
                </Button>

                <Button
                mode="text"
                onPress={() =>
                    toast.info(
                    "Remember to tap Save Section before leaving."
                    )
                }
                >
                Help
                </Button>
            </View>

            <Divider />

            <DeckMachineryManeuveringSection
              onSaved={() => setCurrentStep("SECTION_OVERVIEW")}
            />

            </View>
        );
    }

    /**
     * ============================================================
     * RENDER — STEP 8: CARGO CAPABILITIES
   * ============================================================
   */
  if (currentStep === "CARGO_CAPABILITIES") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Button
            mode="outlined"
            onPress={() =>
              setCurrentStep("SECTION_OVERVIEW")
            }
          >
            Back to Sections
          </Button>

          <Button
            mode="text"
            onPress={() =>
              toast.info(
                "Remember to tap Save Section before leaving."
              )
            }
          >
            Help
          </Button>
        </View>

        <Divider />

        <CargoCapabilitiesSection
          onSaved={() => setCurrentStep("SECTION_OVERVIEW")}
        />

      </View>
    );
  }

  /**
 * ============================================================
 * RENDER — STEP 9: NAVIGATION & COMMUNICATION
 * ============================================================
 */
if (currentStep === "NAVIGATION_COMMUNICATION") {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: androidSystemFooterPadding,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>

        <Button
          mode="text"
          onPress={() =>
            toast.info("Remember to tap Save Section before leaving.")
          }
        >
          Help
        </Button>
      </View>

      <Divider />

      <NavigationCommunicationSection onSaved={() => setCurrentStep("SECTION_OVERVIEW")}/>
    </View>
  );
}
    /**
     * ============================================================
     * RENDER — STEP 10: LIFE SAVING APPLIANCES (LSA)
     * ============================================================
     */
    if (currentStep === "LIFE_SAVING_APPLIANCES") {
    return (
        <View
        style={[
            styles.container,
            {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
            },
        ]}
        >
        <View style={styles.sectionHeader}>
            <Button
            mode="outlined"
            onPress={() => setCurrentStep("SECTION_OVERVIEW")}
            >
            Back to Sections
            </Button>

            <Button
            mode="text"
            onPress={() =>
                toast.info("Remember to tap Save Section before leaving.")
            }
            >
            Help
            </Button>
        </View>

        <Divider />

        <LifeSavingAppliancesSection onSaved={() => setCurrentStep("SECTION_OVERVIEW")}/>
        </View>
    );
    }

    /**
 * ============================================================
 * RENDER — STEP 11: FIRE FIGHTING APPLIANCES (FFA)
 * ============================================================
 */
if (currentStep === "FIRE_FIGHTING_APPLIANCES") {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: androidSystemFooterPadding,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>

        <Button
          mode="text"
          onPress={() =>
            toast.info("Remember to tap Save Section before leaving.")
          }
        >
          Help
        </Button>
      </View>

      <Divider />

      <FireFightingAppliancesSection onSaved={() => setCurrentStep("SECTION_OVERVIEW")}/>
    </View>
  );
}
/**
 * ============================================================
 * RENDER — STEP 12: INERT GAS SYSTEM (IGS)
 * ============================================================
 */
if (currentStep === "INERT_GAS_SYSTEM") {
  const isTanker =
    payload.shipType === "TANKER" ||
    payload.shipType === "OIL_TANKER" ||
    payload.shipType === "PRODUCT_TANKER" ||
    payload.shipType === "CHEMICAL_TANKER";

  if (!isTanker) {
    setCurrentStep("SECTION_OVERVIEW");
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: androidSystemFooterPadding,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>
        <Button
          mode="text"
          onPress={() =>
            toast.info("Remember to tap Save Section before leaving.")
          }
        >
          Help
        </Button>
      </View>

      <Divider />
      <InertGasSystemSection
        onSaved={() => setCurrentStep("SECTION_OVERVIEW")}
      />
    </View>
  );
}

/**
 * ============================================================
 * RENDER — STEP 13: POLLUTION PREVENTION (MARPOL)
 * ============================================================
 */
if (currentStep === "POLLUTION_PREVENTION") {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: androidSystemFooterPadding,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>
        <Button
          mode="text"
          onPress={() =>
            toast.info(
              "Remember to tap Save Section before leaving."
            )
          }
        >
          Help
        </Button>
      </View>
      <Divider />
      <PollutionPreventionSection onSaved={() => setCurrentStep("SECTION_OVERVIEW")}/>
    </View>
  );
}
/**
 * ============================================================
 * RENDER — STEP 2: SECTION OVERVIEW (UX-SAFE)
 * ============================================================
 */
if (currentStep === "SECTION_OVERVIEW") {

/**
 * ============================================================
 * EMPTY STATE — SHIP TYPE MISSING ONLY
 * ============================================================
 *
 * IMPORTANT:
 * - Sections MUST render even if configuration is incomplete
 * - We only block if ship type itself is missing
 */
if (!payload.shipType) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text variant="titleMedium" style={{ fontWeight: "700", marginBottom: 8 }}>
        Sea Service setup incomplete
      </Text>

      <Text
        variant="bodyMedium"
        style={{ opacity: 0.75, textAlign: "center", marginBottom: 12 }}
      >
        Vessel type is missing for this Sea Service record.
      </Text>

      <Button mode="contained" onPress={() => navigation.goBack()}>
        Go Back
      </Button>
    </View>
  );
}


  // ---------- NORMAL SECTION OVERVIEW ----------
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 160 },
        ]}
      >
        {/* Header + progress summary */}
        <View style={styles.sectionsHeaderRow}>
          <Text variant="headlineSmall" style={styles.title}>
            Sea Service Sections
          </Text>

          <Chip mode="outlined" compact style={styles.progressChip}>
            {completedSectionsCount}/{totalSectionsCount} Completed
          </Chip>
        </View>

        <View style={styles.cardGrid}>
          {enabledSections.map((section) => {
            const status: any = (payload as any)?.sectionStatus?.[section.key];
            const statusLabel = getSectionStatusLabel(status);
            const isComplete = status === "COMPLETE";

            return (
              <Card
                key={section.key}
                style={styles.card}
                onPress={() => handleOpenSection(section.key, section.title)}
              >
                <Card.Content>
                  <View style={styles.sectionCardTopRow}>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {section.title}
                    </Text>

                    {/* =====================================================
                        Section Status Capsule (Audit-grade UX)
                      ===================================================== */}
                    <View
                      style={[
                        styles.statusCapsule,
                        status === "COMPLETE"
                          ? styles.statusComplete
                          : status === "IN_PROGRESS"
                          ? styles.statusInProgress
                          : styles.statusNotStarted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusCapsuleText,
                          status === "COMPLETE"
                            ? styles.statusTextComplete
                            : status === "IN_PROGRESS"
                            ? styles.statusTextInProgress
                            : styles.statusTextNotStarted,
                        ]}
                      >
                        {status === "COMPLETE"
                          ? "Completed"
                          : status === "IN_PROGRESS"
                          ? "In Progress"
                          : "Not Started"}
                      </Text>
                    </View>


                  </View>

                  <Text variant="bodySmall" style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

}
/**
 * ============================================================
 * FALLBACK RENDER — UX SAFETY NET (CRITICAL)
 * ============================================================
 *
 * This should NEVER happen in normal flow.
 * If it does, we show a safe recovery UI instead of a blank screen.
 */
return (
  <View
    style={{
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    }}
  >
    <Text
      variant="titleMedium"
      style={{ fontWeight: "700", marginBottom: 8 }}
    >
      Sea Service screen error
    </Text>

    <Text
      variant="bodyMedium"
      style={{
        opacity: 0.75,
        textAlign: "center",
        marginBottom: 16,
      }}
    >
      We couldn’t determine which Sea Service step to show.
    </Text>

    <Button
      mode="contained"
      onPress={() => setCurrentStep("SECTION_OVERVIEW")}
    >
      Go to Sections
    </Button>
  </View>
);
}




/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /**
   * The wizard is ScrollView-based.
   * We reserve bottom padding to avoid Android system nav overlap.
   */
  content: { padding: 16, paddingBottom: 40 },

  title: { fontWeight: "700", marginBottom: 8 },
  subtitle: { marginBottom: 14, opacity: 0.8, lineHeight: 18 },

  /**
   * Step 1 (Ship Type) — UX helpers
   */
  selectedSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  searchBar: {
    borderRadius: 12,
    marginBottom: 10,
  },

  chipRow: {
    paddingVertical: 6,
    paddingRight: 6,
    gap: 8,
    marginBottom: 12,
  },

  chip: {
    borderRadius: 999,
  },

  chipText: {
    fontWeight: "700",
    fontSize: 12,
  },

  quickPickCard: {
    borderRadius: 12,
    marginBottom: 12,
  },

  quickPickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  quickPickItem: {
    width: "48%",
    borderRadius: 12,
  },

  helperCard: {
    borderRadius: 12,
    marginBottom: 12,
  },

  listCard: {
    borderRadius: 12,
    marginBottom: 12,
  },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },

  shipRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  shipRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  /**
   * Section overview + section screens (existing styles)
   * (kept unchanged so we don’t create regressions)
   */
  cardGrid: { gap: 12 },
  card: { borderRadius: 8 },
  cardTitle: { fontWeight: "600", marginBottom: 4 },
  selectedText: { marginTop: 6, fontWeight: "600" },

  sectionDescription: {
    opacity: 0.7,
    marginBottom: 6,
  },
  sectionStatus: {
    fontWeight: "600",
    opacity: 0.8,
  },

  nextButton: { marginTop: 16 },
  backButton: { marginTop: 24 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  bottomActionBar: {
  paddingHorizontal: 16,
  paddingTop: 12,
  borderTopWidth: 1,
  paddingBottom: 64,
},
sectionsHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
},

progressChip: {
  borderRadius: 999,
},

sectionCardTopRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
},

statusChip: {
  borderRadius: 999,
},

statusChipComplete: {
  // Do not force colors; Paper will adapt to theme.
  // Kept as a hook for future accenting if desired.
},

statusRed: {
  backgroundColor: "#D32F2F", // Red - Not Started
},

statusAmber: {
  backgroundColor: "#F9A825", // Amber - In Progress
},

statusGreen: {
  backgroundColor: "#2E7D32", // Green - Completed
},

/**
 * ============================================================
 * Section Status Capsule — Professional / Audit Grade
 * ============================================================
 */

statusCapsule: {
  alignSelf: "flex-start",
  marginTop: 6,
  paddingHorizontal: 10,
  paddingVertical: 3,
  borderRadius: 10,
  borderWidth: 1,
},

statusCapsuleText: {
  fontSize: 11,
  fontWeight: "600",
},

/* -------- NOT STARTED (Red) -------- */
statusNotStarted: {
  backgroundColor: "#FDECEA", // light red tint
  borderColor: "#D32F2F",
},
statusTextNotStarted: {
  color: "#D32F2F",
},

/* -------- IN PROGRESS (Amber) -------- */
statusInProgress: {
  backgroundColor: "#FFF8E1", // light amber tint
  borderColor: "#F9A825",
},
statusTextInProgress: {
  color: "#F9A825",
},

/* -------- COMPLETE (Green) -------- */
statusComplete: {
  backgroundColor: "#E8F5E9", // light green tint
  borderColor: "#2E7D32",
},
statusTextComplete: {
  color: "#2E7D32",
},



});

