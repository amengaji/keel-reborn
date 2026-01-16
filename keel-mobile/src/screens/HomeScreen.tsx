//keel-mobile/src/screens/HomeScreen.tsx

/**
 * ============================================================
 * KEEL — Home Dashboard (Inspector / Compliance Mode)
 * ============================================================
 *
 * PURPOSE:
 * - This is NOT a marketing dashboard
 * - This is NOT a gamified progress screen
 *
 * This screen answers, at a glance:
 * 1) Who is the cadet?
 * 2) On which vessel?
 * 3) Is sea service progressing correctly?
 * 4) Are there compliance risks?
 *
 * DESIGN PRINCIPLES:
 * - Serious, calm, professional tone
 * - Inspector / Training Officer friendly
 * - Read-only snapshot (actions are minimal)
 * - Explicit placeholders (NO fake logic)
 * - Draft-safe and offline-safe
 *
 * IMPORTANT:
 * - No completion logic here
 * - No progress calculation here
 * - Real data wiring happens later
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";

import {KeelScreen} from "../components/ui/KeelScreen";
import { useSeaService } from "../sea-service/SeaServiceContext";
import { getSeaServiceSummary, } from "../sea-service/seaServiceStatus";
import ComplianceIndicatorCard from "../components/home/ComplianceIndicatorCard";
import { useDailyLogs } from "../daily-logs/DailyLogsContext";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { useToast } from "../components/toast/useToast";
import { ensureSeedTasksExist, getAllTaskRecords } from "../db/tasks";



export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

    // ------------------------------------------------------------
  // Toast (errors only — Home is read-only)
  // ------------------------------------------------------------
  const toast = useToast();

  // ------------------------------------------------------------
  // Tasks — SQLite-backed summary (Option C)
  // ------------------------------------------------------------
  const [taskTotalCount, setTaskTotalCount] = useState(0);
  const [taskCompletedCount, setTaskCompletedCount] = useState(0);
  const [taskPendingCount, setTaskPendingCount] = useState(0);

  useEffect(() => {
    try {
      // Safe seed: inserts only if table is empty
      ensureSeedTasksExist();

      const allTasks = getAllTaskRecords();
      const completed = allTasks.filter((t) => t.status === "COMPLETED").length;
      const pending = allTasks.filter((t) => t.status !== "COMPLETED").length;

      setTaskTotalCount(allTasks.length);
      setTaskCompletedCount(completed);
      setTaskPendingCount(pending);
    } catch (err) {
      console.error("HomeScreen: failed to load Tasks from SQLite:", err);
      toast.error("Failed to load tasks.");
    }
  }, [toast]);

  // ------------------------------------------------------------
  // Sea Service data (single source of truth)
  // ------------------------------------------------------------
  const { payload } = useSeaService();

  const seaServiceSummary = getSeaServiceSummary(
    payload?.sections,
    payload?.shipType ?? undefined
  );

  const seaServiceStatusText =
    seaServiceSummary.completedSections === 0 &&
    seaServiceSummary.inProgressSections === 0
      ? "Not Started"
      : seaServiceSummary.inProgressSections > 0
      ? "Attention Needed"
      : "On Track";


  /**
   * NOTE:
   * All values below are placeholders.
   * They will be replaced once:
   * - Sea service progress derivation exists
   * - Watch hours logic exists
   * - Sync status is wired
   */
  const cadetName = "Cadet Name";
  const cadetCategory = "Deck Cadet";
  const vesselName = "Vessel Name";
  const shipType = "Ship Type";
  const seaServicePeriod = "DD MMM YYYY → DD MMM YYYY";
  const syncStatus = "Offline / Not synced";

    /**
   * ============================================================
   * Step 28 — Attention Required (Dynamic)
   * ============================================================
   *
   * RULES:
   * - Inspector-safe: never claim compliance without data
   * - Cadet-friendly: always provide a recommended next step
   * - Show panel even when no issues (your choice: 1.B)
   *
   * Navigation targets:
   * - Daily (watchkeeping + daily logs)
   * - SeaServiceWizard (sea service actions)
   */

  const { logs, status, stcwComplianceStatus,loading, lastLogDate } = useDailyLogs();

  type AttentionAction = () => void;


  const goToDaily = () => navigation.navigate("Daily");
  const goToSeaServiceWizard = () => navigation.navigate("SeaServiceWizard");


  return (
    <KeelScreen>
    <ScrollView
    contentContainerStyle={{flexGrow:1}}
    showsVerticalScrollIndicator={false}
  >
      <View style={styles.container}>
        {/* ============================================================
            1) CADET & VESSEL IDENTITY (ALWAYS VISIBLE)
           ============================================================ */}
        <Card style={styles.identityCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.identityTitle}>
              Cadet & Vessel Identity
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Cadet:</Text> {cadetName}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Category:</Text> {cadetCategory}
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Vessel:</Text> {vesselName}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Ship Type:</Text> {shipType}
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Sea Service Period:</Text>{" "}
              {seaServicePeriod}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Sync Status:</Text> {syncStatus}
            </Text>
          </Card.Content>
        </Card>

        {/* ============================================================
            2) COMPLIANCE SNAPSHOT (PRIMARY FOCUS)
           ============================================================ */}
        <Card style={styles.primaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Compliance Snapshot
            </Text>

            <Divider style={styles.dividerSmall} />

          <Text style={styles.placeholderText}>
            Sea Service Status:{" "}
            <Text style={{ fontWeight: "700" }}>
              {payload?.lastUpdatedAt
                ? payload?.sections
                  ? seaServiceSummary.completedSections ===
                    seaServiceSummary.totalSections
                    ? "Finalised / Complete"
                    : "Draft In Progress"
                  : "Not Started"
                : "Not Started"}
            </Text>
          </Text>

          <Text style={styles.placeholderSubText}>
            Sections completed:{" "}
            {seaServiceSummary.completedSections} /{" "}
            {seaServiceSummary.totalSections}
          </Text>

          {payload?.lastUpdatedAt && (
            <Text style={styles.placeholderSubText}>
              Last updated:{" "}
              {new Date(payload.lastUpdatedAt).toLocaleDateString()}
            </Text>
          )}

          </Card.Content>
        </Card>

        {/* ============================================================
            3) MANDATORY AREAS STATUS (SERIOUS GRID)
           ============================================================ */}
        {/* ============================================================
            3) COMPLIANCE INDICATORS (DERIVED — INSPECTOR SAFE)
           ============================================================ */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Compliance Indicators
        </Text>

        {/* --- Sea Service --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("SeaServiceWizard")}
        >
          <ComplianceIndicatorCard
            title="Sea Service"
            status={
              seaServiceSummary.inProgressSections > 0
                ? "ATTENTION"
                : seaServiceSummary.completedSections ===
                  seaServiceSummary.totalSections
                ? "ON_TRACK"
                : "NOT_AVAILABLE"
            }
            summary={`${seaServiceSummary.completedSections} of ${seaServiceSummary.totalSections} sections completed`}
            explanation={
              seaServiceSummary.inProgressSections > 0
                ? "Some sea service sections have been started but not completed."
                : undefined
            }
            recommendation={
              seaServiceSummary.inProgressSections > 0
                ? "Open Sea Service Wizard and complete the pending sections."
                : undefined
            }
          />


        </TouchableOpacity>


        {/* --- Watchkeeping (STCW) --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Daily")}
        >
          <WatchkeepingCompliance />
        </TouchableOpacity>


        {/* --- Daily Logs --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Daily")}
        >
          <DailyLogsCompliance />
        </TouchableOpacity>


        {/* --- Tasks (SQLite-backed) --- */}
        <ComplianceIndicatorCard
          title="Tasks"
          status={
            taskTotalCount === 0
              ? "NOT_AVAILABLE"
              : taskPendingCount > 0
              ? "ATTENTION"
              : "ON_TRACK"
          }
          summary={
            taskTotalCount === 0
              ? "No tasks available yet"
              : `${taskCompletedCount} of ${taskTotalCount} completed • ${taskPendingCount} pending`
          }
          explanation={
            taskTotalCount > 0 && taskPendingCount > 0
              ? "Some training tasks are not completed yet."
              : undefined
          }
          recommendation={
            taskTotalCount > 0 && taskPendingCount > 0
              ? "Open Tasks and complete pending items to keep your record audit-ready."
              : undefined
          }
        />


        {/* --- Familiarisation (future) --- */}
        <ComplianceIndicatorCard
          title="Familiarisation"
          status="NOT_AVAILABLE"
          summary="Familiarisation progress is not yet available"
        />



        {/* ============================================================
            5) RESTRICTED QUICK ACTIONS
           ============================================================ */}
        <View style={styles.actionsRow}>
          <Button mode="contained">
            Continue Sea Service
          </Button>

          <Button mode="outlined">
            Add Daily Log
          </Button>

          <Button mode="outlined">
            Sync Now
          </Button>
        </View>
      </View>
      </ScrollView>
    </KeelScreen>
  );
}

/* ============================================================
 * Small helper component (local, inspector-grade)
 * ============================================================ */
function StatusCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <Card style={styles.statusCard}>
      <Card.Content>
        <Text style={styles.statusTitle}>{title}</Text>
        <Divider style={styles.dividerSmall} />
        <Text style={styles.statusValue}>{status}</Text>
      </Card.Content>
    </Card>
  );
}

/* ============================================================
 * Watchkeeping Compliance Indicator (STCW)
 * ============================================================ */
function WatchkeepingCompliance() {
  /**
   * IMPORTANT:
   * - This component MUST NOT calculate compliance.
   * - It ONLY reads derived compliance from context.
   */

  const { stcwComplianceStatus, loading, logs } = useDailyLogs();

  // Loading state
  if (loading) {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="NOT_AVAILABLE"
        summary="Loading watchkeeping data."
      />
    );
  }

  // No logs → cannot assess compliance
  if (logs.length === 0) {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="ATTENTION"
        summary="No watchkeeping records found"
        explanation="Without watch/rest hour entries, STCW compliance cannot be verified."
        recommendation="Open Daily Logs and record watch start/end times for each day."
      />
    );
  }

  // Derived compliance from context
  if (stcwComplianceStatus === "NON_COMPLIANT") {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="RISK"
        summary="STCW rest-hour violation detected"
        explanation="Recorded work/rest hours breach STCW minimum rest requirements."
        recommendation="Review recent Daily Logs and inform your Training Officer if entries are correct."
      />
    );
  }

  if (stcwComplianceStatus === "AT_RISK") {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="ATTENTION"
        summary="Rest hours close to STCW limits"
        explanation="Your recent work/rest pattern is approaching STCW minimum limits."
        recommendation="Monitor upcoming watches and ensure adequate rest is recorded."
      />
    );
  }

  // COMPLIANT
  return (
    <ComplianceIndicatorCard
      title="Watchkeeping (STCW)"
      status="ON_TRACK"
      summary="Rest hour requirements are currently met"
      explanation="Your recorded work and rest hours satisfy STCW minimum requirements."
      recommendation="Continue logging watches daily to keep your record audit-ready."
    />
  );
}




/* ============================================================
 * Daily Logs Compliance Indicator
 * ============================================================ */
function DailyLogsCompliance() {
  const { lastLogDate } = useDailyLogs();

  if (!lastLogDate) {
    return (
      <ComplianceIndicatorCard
        title="Daily Logs"
        status="ATTENTION"
        summary="No daily logs recorded yet"
      />
    );
  }

  return (
    <ComplianceIndicatorCard
      title="Daily Logs"
      status="ON_TRACK"
      summary={`Last entry: ${lastLogDate.toDateString()}`}
    />
  );
}


/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  identityCard: {
    marginBottom: 16,
  },
  identityTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  identityLine: {
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
  },

  primaryCard: {
    marginBottom: 20,
  },

  sectionHeader: {
    fontWeight: "700",
    marginBottom: 8,
  },

  sectionTitle: {
    fontWeight: "700",
  },

  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statusCard: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: "600",
  },
  statusValue: {
    opacity: 0.8,
  },

  attentionCard: {
    marginTop: 8,
    marginBottom: 20,
  },
  attentionTitle: {
    fontWeight: "700",
  },

  placeholderText: {
    opacity: 0.85,
  },
  placeholderSubText: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 12,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  dividerSmall: {
    marginVertical: 8,
  },


});
