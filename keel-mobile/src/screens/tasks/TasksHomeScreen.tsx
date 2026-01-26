//keel-mobile/src/screens/tasks/TasksHomeScreen.tsx

/**
 * ============================================================
 * TasksHomeScreen — SECTION OVERVIEW (LIVE DATA)
 * ============================================================
 *
 * UPDATES:
 * - Groups by 'sectionId' (Function) instead of 'categoryId'
 * - Maps Function Codes (1, 2, 3) to Readable Titles (Navigation, Cargo...)
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme, ProgressBar, ActivityIndicator } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelButton } from "../../components/ui/KeelButton";
import { useToast } from "../../components/toast/useToast";
import { getAllTaskRecords } from "../../db/tasks";

// STCW FUNCTION MAP
const STCW_MAP: Record<string, string> = {
  '1': 'Navigation',
  'Function 1': 'Navigation',
  '2': 'Cargo Handling & Stowage',
  'Function 2': 'Cargo Handling & Stowage',
  '3': 'Ship Operations & Care',
  'Function 3': 'Ship Operations & Care',
  '4': 'Marine Engineering',
  'Function 4': 'Marine Engineering',
  '5': 'Electrical & Control',
  'Function 5': 'Electrical & Control',
  '6': 'Maintenance & Repair',
  'Function 6': 'Maintenance & Repair',
  '7': 'Radio Communications',
  'Function 7': 'Radio Communications'
};

type SectionData = {
  key: string;
  title: string;
  total: number;
  completed: number;
  progress: number;
};

export default function TasksHomeScreen() {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();

  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const allTasks = getAllTaskRecords();

      if (allTasks.length === 0) {
        setSections([]);
        setLoading(false);
        return;
      }

      // GROUP BY SECTION (FUNCTION)
      const groups: Record<string, SectionData> = {};

      allTasks.forEach((task) => {
        // Use sectionId (Function) or fallback
        const sectionKey = task.sectionId || "General";
        
        // Map to readable title
        const displayTitle = STCW_MAP[sectionKey] 
          ? `Function ${sectionKey.replace('Function ', '')}: ${STCW_MAP[sectionKey]}`
          : sectionKey;

        if (!groups[sectionKey]) {
          groups[sectionKey] = {
            key: sectionKey,
            title: displayTitle,
            total: 0,
            completed: 0,
            progress: 0
          };
        }

        groups[sectionKey].total += 1;
        if (task.status === "COMPLETED") {
          groups[sectionKey].completed += 1;
        }
      });

      const sectionList = Object.values(groups).map(group => ({
        ...group,
        progress: group.total === 0 ? 0 : group.completed / group.total
      }));

      // Sort by Function Number (e.g. "1", "2") if possible
      sectionList.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

      setSections(sectionList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task sections");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeelScreen>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>Tasks</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Training Record Book
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ opacity: 0.5 }}>No tasks found.</Text>
              <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 4 }}>Run "Data Sync" to fetch your TRB.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <KeelCard>
              <View style={styles.cardRow}>
                <View style={styles.statusStripWrap}>
                  <View style={[styles.statusStrip, { backgroundColor: item.progress === 1 ? theme.colors.primary : theme.colors.surfaceVariant }]} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text variant="titleMedium" style={styles.sectionTitle} numberOfLines={2}>{item.title}</Text>
                    <KeelButton
                      mode="secondary"
                      onPress={() => navigation.navigate("TaskSection", {
                        sectionKey: item.key, // Passing 'Function 1' or '1'
                        sectionTitle: item.title,
                      })}
                    >
                      Open
                    </KeelButton>
                  </View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Progress: {item.completed} / {item.total} tasks
                  </Text>
                  <ProgressBar progress={item.progress} color={theme.colors.primary} style={styles.progress} />
                </View>
              </View>
            </KeelCard>
          )}
        />
      )}
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 4 },
  title: { fontWeight: "700", marginBottom: 4 },
  subtitle: { marginBottom: 16 },
  list: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", height: 300 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  cardRow: { flexDirection: "row", alignItems: "stretch" },
  statusStripWrap: { paddingVertical: 10 },
  statusStrip: { width: 4, flex: 1, borderRadius: 2 },
  cardContent: { flex: 1, paddingLeft: 12, paddingVertical: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  sectionTitle: { fontWeight: "700", flex: 1, paddingRight: 8 },
  progress: { height: 4, borderRadius: 2, marginTop: 6 },
});