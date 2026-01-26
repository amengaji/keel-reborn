//keel-mobile/src/screens/tasks/TaskSectionScreen.tsx

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

  // Params passed from Home Screen
  const { sectionKey, sectionTitle } = route.params as RouteParams;

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");
  const [debugInfo, setDebugInfo] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [sectionKey])
  );

  const loadTasks = async () => {
    try {
      const allTasks = getAllTaskRecords();
      
      const targetKey = String(sectionKey).trim();

      const filtered = allTasks.filter(t => {
        const taskSection = t.sectionId ? String(t.sectionId).trim() : "General";
        return taskSection === targetKey;
      });

      console.log(`>>> FILTER DEBUG: Target='${targetKey}', Found=${filtered.length} tasks.`);
      
      if (filtered.length === 0) {
        const sampleSection = allTasks.length > 0 ? allTasks[0].sectionId : "No Data";
        setDebugInfo(`Target Key: "${targetKey}"\nFirst DB Record Section: "${sampleSection}"`);
      }

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
  const mandatoryTasks = tasks; 
  const optionalTasks: TaskRecord[] = []; 

  const visibleTasks = activeTab === "MANDATORY" ? mandatoryTasks : optionalTasks;

  const getProgress = (list: TaskRecord[]) => {
    const total = list.length;
    const completed = list.filter(t => t.status === "COMPLETED").length;
    return { total, completed, percent: total === 0 ? 0 : (completed / total) * 100 };
  };

  const mandStats = getProgress(mandatoryTasks);
  const optStats = getProgress(optionalTasks);

  // ------------------------------------------------------------
  // Helper: Get Status Styles (Capsule Colors)
  // ------------------------------------------------------------
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { bg: "#D1FAE5", text: "#059669", label: "Completed" }; // Green
      case "IN_PROGRESS":
        return { bg: "#FEF3C7", text: "#D97706", label: "In Progress" }; // Orange
      default: // NOT_STARTED
        return { bg: "#FEE2E2", text: "#DC2626", label: "Not Started" }; // Red
    }
  };

  // ------------------------------------------------------------
  // Render Item
  // ------------------------------------------------------------
  const renderTaskCard = ({ item }: { item: TaskRecord }) => {
    const statusStyle = getStatusStyles(item.status);

    return (
      <KeelCard>
        <View style={styles.cardContent}>
          {/* Badge: Show Task Code */}
          <View style={[styles.badge, { borderColor: theme.colors.outline }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.taskKey}
            </Text>
          </View>

          <Text variant="bodyLarge" style={styles.taskTitle} numberOfLines={2}>
            {item.taskTitle}
          </Text>

          <View style={styles.footerRow}>
            {/* ✅ NEW: Capsule Status Pill */}
            <View style={[styles.capsule, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.capsuleText, { color: statusStyle.text }]}>
                {statusStyle.label.toUpperCase()}
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks found.</Text>
              <Text style={styles.debugText}>DEBUG INFO:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
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
  
  // ✅ CAPSULE STYLES
  capsule: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12, // Fully rounded ends
    alignSelf: 'flex-start'
  },
  capsuleText: {
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.5
  },

  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { textAlign: "center", opacity: 0.5, fontSize: 16 },
  debugText: { textAlign: "center", opacity: 0.3, fontSize: 10, marginTop: 4, color: 'red' }
});