//keel-mobile/src/screens/tasks/TaskSectionScreen.tsx

/**
 * ============================================================
 * TaskSectionScreen — TASK LIST (LIVE DB)
 * ============================================================
 *
 * PURPOSE:
 * - Display tasks for a specific Category (passed as sectionKey)
 * - Reads from SQLite 'task_records'
 *
 * UPDATES:
 * - Replaced Mock Data with DB Fetch
 * - Filters by categoryId
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { IconButton, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { getAllTaskRecords, TaskRecord } from "../../db/tasks";

type RouteParams = {
  sectionKey: string;
  sectionTitle: string;
};

export default function TaskSectionScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { sectionKey, sectionTitle } = route.params as RouteParams;

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");

  // Reload data whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [sectionKey])
  );

  const loadTasks = async () => {
    try {
      const allTasks = getAllTaskRecords();
      
      // Filter tasks belonging to this section/category
      // We handle the "General Tasks" fallback matching HomeScreen logic
      const filtered = allTasks.filter(t => {
        const cat = t.categoryId || "General Tasks";
        return cat === sectionKey;
      });

      setTasks(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Filter & Stats Logic
  // ------------------------------------------------------------
  // NOTE: In your DB, 'min_evidence > 0' or specific flag determines mandatory.
  // For now, we assume ALL tasks are mandatory unless specified otherwise.
  // You can adjust this logic based on your 'mandatory' field from backend if synced.
  const mandatoryTasks = tasks; // Currently treating all as mandatory for simplicity
  const optionalTasks: TaskRecord[] = []; // Split this if you add 'mandatory' column to DB

  const visibleTasks = activeTab === "MANDATORY" ? mandatoryTasks : optionalTasks;

  const getProgress = (list: TaskRecord[]) => {
    const total = list.length;
    const completed = list.filter(t => t.status === "COMPLETED").length;
    return { total, completed, percent: total === 0 ? 0 : (completed / total) * 100 };
  };

  const mandStats = getProgress(mandatoryTasks);
  const optStats = getProgress(optionalTasks);

  // ------------------------------------------------------------
  // Render Item
  // ------------------------------------------------------------
  const renderTaskCard = ({ item }: { item: TaskRecord }) => {
    // Status Color Mapping
    let statusColor = theme.colors.onSurfaceVariant;
    let statusLabel = "Not Started";

    if (item.status === "IN_PROGRESS") {
      statusColor = theme.colors.tertiary;
      statusLabel = "In Progress";
    } else if (item.status === "COMPLETED") {
      statusColor = theme.colors.primary;
      statusLabel = "Completed"; // Or "Signed Off"
    }

    return (
      <KeelCard>
        <View style={styles.cardContent}>
          {/* Badge (Optional visually) */}
          <View style={[styles.badge, { borderColor: theme.colors.outline }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.taskKey}
            </Text>
          </View>

          <Text variant="bodyLarge" style={styles.taskTitle} numberOfLines={2}>
            {item.taskTitle}
          </Text>

          <View style={styles.footerRow}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "22" }]}>
              <Text variant="labelSmall" style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>

            <IconButton
              icon="chevron-right"
              size={22}
              onPress={() => navigation.navigate("TaskDetails", { taskKey: item.taskKey })}
            />
          </View>
        </View>
      </KeelCard>
    );
  };

  return (
    <KeelScreen>
      <Text variant="titleLarge" style={styles.title}>{sectionTitle}</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Text
          onPress={() => setActiveTab("MANDATORY")}
          style={[styles.tabItem, activeTab === "MANDATORY" && { color: theme.colors.primary, borderBottomColor: theme.colors.primary }]}
        >
          Mandatory ({mandStats.completed}/{mandStats.total})
        </Text>
        <Text
          onPress={() => setActiveTab("OPTIONAL")}
          style={[styles.tabItem, activeTab === "OPTIONAL" && { color: theme.colors.primary, borderBottomColor: theme.colors.primary }]}
        >
          Optional ({optStats.completed}/{optStats.total})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskCard}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks found in this section.</Text>
          }
        />
      )}
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", marginBottom: 12 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 16 },
  tabItem: { flex: 1, textAlign: "center", paddingVertical: 10, fontWeight: "600", borderBottomWidth: 2, borderColor: "transparent", color: "#6B7280" },
  cardContent: { paddingVertical: 8 },
  badge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  taskTitle: { fontWeight: "600", marginBottom: 6 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 20, opacity: 0.5 }
});