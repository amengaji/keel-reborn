//keel-mobile/src/screens/tasks/TaskSectionScreen.tsx

/**
 * ============================================================
 * TaskSectionScreen — TASK LIST (REFINED UI)
 * ============================================================
 *
 * PURPOSE:
 * - Display tasks within a section
 * - Clearly distinguish Mandatory vs Optional
 * - Show task status at a glance
 *
 * DESIGN GOALS:
 * - Maritime logbook density
 * - Inspector-safe clarity
 * - Subtle actions, strong information
 *
 * NOTE:
 * - No status mutation here
 * - No DB assumptions
 * - Navigation unchanged
 */

import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelButton } from "../../components/ui/KeelButton";

/**
 * ============================================================
 * Route Params
 * ============================================================
 */
type RouteParams = {
  sectionKey: string;
  sectionTitle: string;
};

/**
 * ============================================================
 * TEMP TASK MODEL (PLACEHOLDER)
 * ============================================================
 */
type TaskItem = {
  taskKey: string;
  id: number;
  title: string;
  mandatory: boolean;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED_BY_CADET" | "SIGNED_OFF";
};

/**
 * ============================================================
 * TEMP TASK DATA (PER SECTION)
 * ============================================================
 */
const MOCK_TASKS_BY_SECTION: Record<string, TaskItem[]> = {
  NAV: [
    {
      id: 1,
      taskKey: "DC.NAV.001",
      title: "Identify and explain use of nautical charts",
      mandatory: true,
      status: "NOT_STARTED",
    },
    {
      id: 2,
      taskKey: "DC.NAV.002",
      title: "Assist in preparation of passage plan",
      mandatory: true,
      status: "IN_PROGRESS",
    },
    {
      id: 3,
      taskKey: "DC.NAV.003",
      title: "Observe position fixing methods",
      mandatory: false,
      status: "NOT_STARTED",
    },
  ],
};

export default function TaskSectionScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { sectionKey, sectionTitle } = route.params as RouteParams;

  const tasks = MOCK_TASKS_BY_SECTION[sectionKey] ?? [];

  const mandatoryTasks = tasks.filter((t) => t.mandatory);
  const optionalTasks = tasks.filter((t) => !t.mandatory);

  type TaskTab = "MANDATORY" | "OPTIONAL";
  const [activeTab, setActiveTab] = React.useState<TaskTab>("MANDATORY");

  const visibleTasks =
    activeTab === "MANDATORY" ? mandatoryTasks : optionalTasks;


  const mandatoryProgress = getSectionProgress(mandatoryTasks);
  const optionalProgress = getSectionProgress(optionalTasks);

  /**
   * ------------------------------------------------------------
   * Status label (maritime-correct wording)
   * ------------------------------------------------------------
   */
  function renderStatus(status: TaskItem["status"]) {
    switch (status) {
      case "SIGNED_OFF":
        return { label: "Signed Off", color: theme.colors.primary };
      case "COMPLETED_BY_CADET":
        return { label: "Submitted", color: theme.colors.secondary };
      case "IN_PROGRESS":
        return { label: "In Progress", color: theme.colors.tertiary };
      default:
        return { label: "Not Started", color: theme.colors.onSurfaceVariant };
    }
  }

  /**
 * ------------------------------------------------------------
 * Section Progress Calculator (Inspector-safe)
 * ------------------------------------------------------------
 */
function getSectionProgress(tasks: TaskItem[]) {
  const total = tasks.length;
  const completed = tasks.filter(
    (t) => t.status === "SIGNED_OFF" || t.status === "COMPLETED_BY_CADET"
  ).length;

  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}


  /**
   * ------------------------------------------------------------
   * Task Card Renderer (reusable)
   * ------------------------------------------------------------
   */
  function renderTaskCard(item: TaskItem) {
    const status = renderStatus(item.status);

    return (
      <KeelCard>
        <View style={styles.cardContent}>
          {/* Badge */}
          <View
            style={[
              styles.badge,
              {
                borderColor: item.mandatory
                  ? theme.colors.error
                  : theme.colors.outline,
                backgroundColor: item.mandatory
                  ? theme.colors.error + "11"
                  : "transparent",
              },
            ]}
          >
            <Text
              variant="labelSmall"
              style={{
                color: item.mandatory
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant,
                fontWeight: "600",
              }}
            >
              {item.mandatory ? "MANDATORY" : "OPTIONAL"}
            </Text>
          </View>

          {/* Title */}
          <Text
            variant="bodyLarge"
            style={styles.taskTitle}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Status + Action Row */}
          <View style={styles.footerRow}>
            {/* Status Pill */}
            <View
              style={[
                styles.statusPill,
                { backgroundColor: status.color + "22" },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[styles.statusText, { color: status.color }]}
              >
                {status.label}
              </Text>
            </View>

            {/* Subtle Drill-down */}
            <IconButton
              icon="chevron-right"
              size={22}
              onPress={() =>
                navigation.navigate("TaskDetails", {
                  taskKey: item.taskKey,
                })
              }
              accessibilityLabel="Open task"
            />
          </View>

        </View>
      </KeelCard>
    );
  }

  return (
    <KeelScreen>
      {/* ======================================================== */}
      <Text variant="titleLarge" style={styles.title}>
        {sectionTitle}
      </Text>

    {/* ========================================================
        Horizontal Tabs — Mandatory / Optional
      ======================================================== */}
    <View style={styles.tabBar}>
      {(["MANDATORY", "OPTIONAL"] as const).map((tab) => {
        const isActive = activeTab === tab;

        return (
          <Text
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              {
                color: isActive
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                borderBottomColor: isActive
                  ? theme.colors.primary
                  : "transparent",
              },
            ]}
          >
            {tab === "MANDATORY"
              ? `Mandatory (${mandatoryProgress.completed}/${mandatoryProgress.total})`
              : `Optional (${optionalProgress.completed}/${optionalProgress.total})`}
          </Text>
        );
      })}
    </View>

    {/* ========================================================
        Unified Progress Bar
      ======================================================== */}
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${
              activeTab === "MANDATORY"
                ? mandatoryProgress.percent
                : optionalProgress.percent
            }%`,
            backgroundColor:
              activeTab === "MANDATORY"
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
          },
        ]}
      />
    </View>

    {/* ========================================================
        Task List (Tab-Driven)
      ======================================================== */}
    <FlatList
      data={visibleTasks}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => renderTaskCard(item)}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No {activeTab.toLowerCase()} tasks in this section.
        </Text>
      }
    />

    </KeelScreen>
  );
}

/**
 * ============================================================
 * Styles — Dense, Professional
 * ============================================================
 */
const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginBottom: 12,
  },
  groupTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyText: {
    marginVertical: 8,
    color: "#6B7280",
  },

  statusPill: {
  paddingHorizontal: 10,
  paddingVertical: 3,
  borderRadius: 12,
},

statusText: {
  fontWeight: "600",
},

footerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 6,
},

  cardContent: {
    paddingVertical: 8,
  },
  badge: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  taskTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },

  openButtonWrap: {
    marginLeft: 8,
  },

  sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 12,
  marginBottom: 4,
},

progressBar: {
  height: 4,
  backgroundColor: "#E5E7EB",
  borderRadius: 2,
  overflow: "hidden",
  marginBottom: 8,
},

progressFill: {
  height: "100%",
},
tabBar: {
  flexDirection: "row",
  borderBottomWidth: 1,
  borderBottomColor: "#E5E7EB",
  marginBottom: 8,
},

tabItem: {
  flex: 1,
  textAlign: "center",
  paddingVertical: 10,
  fontWeight: "600",
  borderBottomWidth: 2,
},

});
