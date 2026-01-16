//keel-mobile/src/screens/SeaServiceScreen.tsx

/**
 * ============================================================
 * Sea Service Dashboard — Lifecycle View (Phase 3B)
 * ============================================================
 *
 * PURPOSE:
 * - Show ACTIVE Sea Service (DRAFT) as primary card
 * - Show FINAL Sea Service history as read-only cards (multiple)
 * - Keep "Add Sea Service" always visible (disabled if DRAFT exists)
 *
 * ARCHITECTURE RULES:
 * - Screen is UI-only: NO direct SQLite reads/writes
 * - All state comes from SeaServiceContext
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
  Dialog,
  Portal,
  Divider,
  TextInput,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { MainStackParamList } from "../navigation/types";
import { useToast } from "../components/toast/useToast";
import { useSeaService } from "../sea-service/SeaServiceContext";
import { getSeaServiceSummary } from "../sea-service/seaServiceStatus";
import DateInputField from "../components/inputs/DateInputField"; 

/**
 * Helper: Format date safely for UI display.
 * - Accepts ISO string or Date (defensive)
 * - Returns "—" if missing/invalid
 */
function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function SeaServiceScreen() {
  const theme = useTheme();
  const toast = useToast();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  /**
   * SeaServiceContext is the SINGLE SOURCE OF TRUTH:
   * - seaServiceId indicates an ACTIVE DRAFT exists
   * - payload is the ACTIVE draft payload (or default empty payload)
   * - finalHistory is the read-only list of FINAL records
   */
  const {
    payload,
    seaServiceId,
    finalHistory,
    
    canFinalize,
    finalizeSeaService,
    discardDraft,
  } = useSeaService();

  /**
   * Derived UI-only vessel identity (for ACTIVE draft).
   * Vessel identity is stored inside GENERAL_IDENTITY section.
   */
  const activeShipName =
    payload.sections.GENERAL_IDENTITY?.vesselName ?? "Sea Service";
  const activeImoNumber = payload.sections.GENERAL_IDENTITY?.imoNumber ?? null;

/**
 * ============================================================
 * SECTION PROGRESS (SHIP-TYPE AWARE)
 * ============================================================
 *
 * RULE:
 * - Count ONLY sections applicable to the selected ship type
 * - INERT_GAS_SYSTEM is excluded for non-tankers
 * - Progress must reflect real PSC / TRB applicability
 */
const sectionStatus = payload?.sectionStatus ?? {};
const shipType = payload?.shipType ?? "";

/**
 * Determine if IGS applies for this ship type
 */
const isTanker =
  shipType === "OIL_TANKER" || shipType === "CHEMICAL_TANKER";

/**
 * Build the list of enabled section keys (TYPE-SAFE)
 */
const enabledSectionKeys = (
  Object.keys(sectionStatus) as Array<keyof typeof sectionStatus>
).filter((key) => {
  if (key === "INERT_GAS_SYSTEM" && !isTanker) return false;
  return true;
});

/**
 * Calculate progress using ONLY enabled sections
 */
const activeSectionSummary = {
  completedSections: enabledSectionKeys.filter(
    (key) => sectionStatus[key] === "COMPLETE"
  ).length,
  totalSections: enabledSectionKeys.length,
};




  /**
   * FINALIZE ELIGIBILITY (UX-only cue)
   * - Sign-off is required to finalize (your confirmed rule)
   * - Sections must be complete (audit-grade)
   */
  const hasSignOff = !!payload.servicePeriod?.signOffDate;
  const allSectionsComplete = activeSectionSummary
    ? activeSectionSummary.completedSections === activeSectionSummary.totalSections
    : false;

  const canFinalizeUX = hasSignOff && allSectionsComplete;

  /**
   * Finalize confirmation dialog state
   */
  const [showFinalizeConfirm, setShowFinalizeConfirm,] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);


  /**
 * ============================================================
 * SIGN-OFF ENTRY MODAL STATE (SERVICE CLOSURE)
 * ============================================================
 */
const [showSignOffModal, setShowSignOffModal] = React.useState(false);
const [signOffDate, setSignOffDate] = React.useState<Date | null>(
  payload.servicePeriod?.signOffDate ?? null
);
const [signOffPort, setSignOffPort] = React.useState<string>(
  payload.servicePeriod?.signOffPort ?? ""
);



  const handleContinueService = () => {
    navigation.navigate("SeaServiceWizard");
    toast.info("Continuing Sea Service...");
  };

  const handleAddSeaService = () => {
    navigation.navigate("StartSeaService");
    toast.info("Starting new Sea Service...");
  };

  const handleFinalizePress = () => {
    setShowFinalizeConfirm(true);
  };

  const handleConfirmFinalize = async () => {
    try {
      await finalizeSeaService();
      setShowFinalizeConfirm(false);
      navigation.goBack();
    } catch (err) {
      toast.error("Failed to finalize Sea Service.");
    }
  };
  /**
   * Discard current Sea Service draft (DRAFT only)
   * - Opens confirmation dialog (audit-grade UX)
   */
  const handleDiscardDraft = () => {
    setShowDiscardConfirm(true);
  };

  /**
   * Confirm discard (calls context single authority)
   */
  const handleConfirmDiscard = async () => {
    try {
      await discardDraft();
      setShowDiscardConfirm(false);
      // Stay on this screen; UI will update automatically when seaServiceId becomes null.
    } catch (err) {
      // Context already toasts; keep screen defensive.
      setShowDiscardConfirm(false);
    }
  };



  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ========================================================
          HEADER
         ======================================================== */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Sea Service
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Your cadet sea-time record (STCW compliant)
        </Text>
      </View>

      {/* ========================================================
          ACTIVE SEA SERVICE (DRAFT) — ONLY WHEN seaServiceId EXISTS
         ======================================================== */}
      {!!seaServiceId && (
        <Card style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {activeShipName}
                </Text>
                <Chip 
                  mode="flat" 
                  compact
                  style={{ backgroundColor: theme.colors.primary }}
                  textStyle={{ color: theme.colors.onPrimary }}                  
                  >
                  Active
                </Chip>
              </View>

              {/* =====================================================
                  ICON ACTIONS — ACTIVE DRAFT (UX-2B)
                ===================================================== */}
              <View style={styles.iconActions}>
                {/* Continue / Edit (✏️) */}
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={25}
                  color={theme.colors.primary}
                  onPress={handleContinueService}
                />

                {/* Finalize (🔒) */}
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={25}
                  color={canFinalizeUX ? theme.colors.primary : theme.colors.outline}
                  onPress={canFinalizeUX ? handleFinalizePress : undefined}
                />

                {/* Discard (🗑️) */}
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={25}
                  color={theme.colors.error}
                  onPress={handleDiscardDraft}
                />
              </View>
            </View>


            {activeImoNumber && (
              <Text variant="bodySmall" style={styles.metaText}>
                IMO: {activeImoNumber}
              </Text>
            )}

          {/* ============================================================
              SERVICE PERIOD (SIGN-ON / SIGN-OFF)
              UX RULES:
              - Pencil icon only if NOT finalized
              - Add Sign-Off only when ALL sections complete
              - Icons ALWAYS on the LEFT
              ============================================================ */}
          <View style={{ marginTop: 8 }}>

            {/* ---------------- SIGN-ON ---------------- */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              {!canFinalize && (
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                  onPress={() => navigation.navigate("StartSeaService")}/>
              )}

              <Text variant="bodySmall" style={styles.metaText}>
                Sign On: {formatDate(payload.servicePeriod?.signOnDate)}
                {payload.servicePeriod?.signOnPort
                  ? ` · ${payload.servicePeriod.signOnPort}`
                  : ""}
              </Text>
            </View>

              {/* ---------------- SIGN-OFF ---------------- */}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                {payload.servicePeriod?.signOffDate ? (
                  <>
                    {!canFinalize && (
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={22}
                        color={theme.colors.primary}
                        style={{ marginRight: 6 }}
                        onPress={() => setShowSignOffModal(true)}
                      />
                    )}

                    <Text
                      variant="bodySmall"
                      style={styles.metaText}
                      onPress={!canFinalize ? () => setShowSignOffModal(true) : undefined}
                    >
                      Sign Off: {formatDate(payload.servicePeriod.signOffDate)} ·{" "}
                      {payload.servicePeriod.signOffPort}
                    </Text>
                  </>
                ) : (
                  <>
                    {/* Plus icon is ALWAYS visible, enabled only when sections complete */}
                    <MaterialCommunityIcons
                      name="plus-circle-outline"
                      size={22}
                      color={
                        allSectionsComplete
                          ? theme.colors.primary
                          : theme.colors.onSurfaceDisabled
                      }
                      style={{ marginRight: 6 }}
                      onPress={allSectionsComplete ? () => setShowSignOffModal(true) : undefined}
                    />

                    <Text
                      variant="bodySmall"
                      style={[
                        styles.metaText,
                        {
                          color: allSectionsComplete
                            ? theme.colors.primary
                            : theme.colors.onSurfaceDisabled,
                        },
                      ]}
                    >
                      Sign Off: {allSectionsComplete ? "Add sign-off" : "Complete sections first"}
                    </Text>
                  </>
                )}

              </View>
            </View>



            {/* --------------------------------------------------------
                SECTION COMPLETION INDICATOR (UX ONLY)
               -------------------------------------------------------- */}
            {activeSectionSummary && (
              <View style={styles.progressBlock}>
                <Text variant="bodySmall" style={styles.progressLabel}>
                  Progress
                </Text>

                <View style={styles.progressRow}>
                  <Chip mode="flat"
                    style={{ backgroundColor: theme.colors.primary }}
                    textStyle={{ color: theme.colors.onPrimary }}                    
                  >
                    {activeSectionSummary.completedSections} /{" "}
                    {activeSectionSummary.totalSections} completed
                  </Chip>

                  <Chip
                    mode="flat"
                    compact
                    style={{
                      backgroundColor: canFinalizeUX
                        ? "#2E7D32" // Green — Ready
                        : allSectionsComplete
                        ? "#ED6C02" // Orange — Sign-off required
                        : "#ED6C02", // Amber — In progress
                    }}
                    textStyle={{ color: "#FFFFFF" }}
                  >
                    {canFinalizeUX
                      ? "Ready to Finalize"
                      : allSectionsComplete
                      ? "Sign-off Required"
                      : "In Progress"}
                  </Chip>

                </View>
              </View>
            )}

            {/* --------------------------------------------------------
                FINALIZE ELIGIBILITY CUE (UX ONLY)
               -------------------------------------------------------- */}
            <View style={{ marginTop: 12 }}>
              {canFinalizeUX ? (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.primary }}
                >
                  Ready to Finalize – all mandatory sections completed and
                  sign-off recorded.
                </Text>
              ) : (
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  Not ready to finalize.
                  {!hasSignOff && " Sign-off not recorded."}
                  {!allSectionsComplete && " Some sections are incomplete."}
                </Text>
              )}
            </View>
          </Card.Content>

        </Card>
      )}

      {/* ========================================================
          EMPTY STATE — NO ACTIVE DRAFT + NO HISTORY
         ======================================================== */}
      {!seaServiceId && finalHistory.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No Sea Service started yet.
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Start a new Sea Service when you join a vessel.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* ========================================================
          SEA SERVICE HISTORY (FINAL) — MULTIPLE READ-ONLY RECORDS
         ======================================================== */}
      {finalHistory.length > 0 && (
        <View style={styles.historyBlock}>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={styles.historyTitle}>
              Sea Service History
            </Text>
            <Text variant="bodySmall" style={styles.historySubtitle}>
              Finalized records are read-only for compliance and audit integrity.
            </Text>
          </View>

          <Divider style={{ marginBottom: 12 }} />

          {finalHistory.map((rec) => {
            const shipName = rec.shipName || "Sea Service";
            const imoNumber = rec.imoNumber || null;

            const summary = getSeaServiceSummary(
              rec.payload.sections,
              rec.payload.shipType ?? undefined
            );

            return (
              <Card key={rec.id} style={styles.historyCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {shipName}
                    </Text>
                    <Chip
                      mode="flat"
                      style={{ backgroundColor: "#2E7D32" }}
                      textStyle={{ color: "#FFFFFF" }}
                    >
                      COMPLETED
                    </Chip>

                  </View>

                  {imoNumber && (
                    <Text variant="bodySmall" style={styles.metaText}>
                      IMO: {imoNumber}
                    </Text>
                  )}

                  <Text variant="bodySmall" style={styles.metaText}>
                    Sign On: {formatDate(rec.signOnDate)}
                  </Text>

                  <Text variant="bodySmall" style={styles.metaText}>
                    Sign Off: {formatDate(rec.signOffDate)}
                  </Text>

                  <View style={{ marginTop: 12 }}>
                    <Chip mode="outlined">
                      {summary.completedSections} / {summary.totalSections} completed
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {/* ========================================================
          ADD SEA SERVICE CTA (ALWAYS VISIBLE)
         ======================================================== */}
      <Button
        mode="contained"
        style={styles.addButton}
        disabled={!!seaServiceId}
        onPress={handleAddSeaService}
      >
        Add Sea Service
      </Button>

      {!!seaServiceId && (
        <Text
          variant="bodySmall"
          style={{ textAlign: "center", marginTop: 8, opacity: 0.6 }}
        >
          Finalize the current Sea Service before adding a new one.
        </Text>
      )}

      {/* ========================================================
          FINALIZE CONFIRMATION DIALOG
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showFinalizeConfirm}
          onDismiss={() => setShowFinalizeConfirm(false)}
        >
          <Dialog.Title>Finalize Sea Service</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyMedium">
              Once finalized, this Sea Service record becomes read-only and
              cannot be edited or deleted.
            </Text>

            <Text variant="bodySmall" style={{ marginTop: 12, opacity: 0.7 }}>
              This action is required for STCW compliance and audit integrity.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowFinalizeConfirm(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleConfirmFinalize}>
              Finalize
            </Button>
          </Dialog.Actions>
        </Dialog>
                {/* ========================================================
            DISCARD DRAFT CONFIRMATION DIALOG (DRAFT ONLY)
           ======================================================== */}
        <Dialog
          visible={showDiscardConfirm}
          onDismiss={() => setShowDiscardConfirm(false)}
        >
          <Dialog.Title>Discard Draft</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyMedium">
              This will permanently delete your current Sea Service draft.
            </Text>

            <Text variant="bodySmall" style={{ marginTop: 12, opacity: 0.7 }}>
              Finalized (FINAL) Sea Service records cannot be deleted for STCW
              compliance and audit integrity.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowDiscardConfirm(false)}>
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={handleConfirmDiscard}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
            >
              Discard
            </Button>
          </Dialog.Actions>
        </Dialog>

       {/* ========================================================
            SIGN-OFF ENTRY DIALOG (SERVICE CLOSURE)
           ======================================================== */}
        <Dialog
          visible={showSignOffModal}
          onDismiss={() => setShowSignOffModal(false)}
        >
          <Dialog.Title>Sign-Off Details</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodySmall" style={{ marginBottom: 8, opacity: 0.7 }}>
              Enter sign-off details when you leave the vessel.
            </Text>

          {/* ============================================================
              SIGN-OFF DATE (DATE PICKER – SAME AS SIGN-ON)
          ============================================================ */}
          <DateInputField
            label="Sign-Off Date"
            value={signOffDate}
            onChange={setSignOffDate}
          />

          {/* ============================================================
              SIGN-OFF PORT
          ============================================================ */}
          <TextInput
            label="Sign-Off Port"
            value={signOffPort}
            onChangeText={setSignOffPort}
            mode="outlined"
            style={{ marginTop: 12 }}
          />

          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowSignOffModal(false)}>
              Cancel
            </Button>

            <Button
              mode="contained"
              style={{
                borderRadius: 18,
                height: 40,
                justifyContent: "center",
              }}
              contentStyle={{ height: 40 }}
              onPress={() => {
                if (!signOffDate || !signOffPort.trim()) {
                  toast.error(
                    "Sign-Off date and port are mandatory to finalize."
                  );
                  return;
                }

                payload.servicePeriod.signOffDate = signOffDate;
                payload.servicePeriod.signOffPort = signOffPort;

                toast.success("Sign-Off details saved.");
                setShowSignOffModal(false);
              }}
            >
              Save
            </Button>

          </Dialog.Actions>
        </Dialog>


      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontWeight: "700", marginBottom: 4 },
  subtitle: { opacity: 0.7 },

  serviceCard: { marginBottom: 16 },

  historyBlock: { marginTop: 4, marginBottom: 16 },
  historyHeader: { marginBottom: 8 },
  historyTitle: { fontWeight: "700" },
  historySubtitle: { marginTop: 4, opacity: 0.7 },

  historyCard: { marginBottom: 12 },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  cardTitle: { fontWeight: "600" },

  metaText: {
    opacity: 0.7,
    marginTop: 4,
  },

  progressBlock: {
    marginTop: 12,
  },

  progressLabel: {
    marginBottom: 6,
    opacity: 0.7,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

    /**
   * ------------------------------------------------------------
   * Mobile-safe action layout
   * ------------------------------------------------------------
   * Card.Actions defaults to horizontal layout.
   * We override it to a vertical stack so 3 buttons never overflow.
   */
  actionsStack: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  /**
   * Full-width button inside stacked Card.Actions
   */
  actionButton: {
    width: "100%",
  },

  /**
   * Ensure button content is centered and has consistent height.
   * (Helps touch-target size for cadets on phones/tablets.)
   */
  actionButtonContent: {
    height: 44,
    justifyContent: "center",
  },
  iconActions: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
},



  emptyCard: { marginTop: 8, marginBottom: 16 },
  emptyText: { textAlign: "center", marginBottom: 4 },
  emptySubtext: { textAlign: "center", opacity: 0.6 },

  addButton: { marginTop: 8 },
});
