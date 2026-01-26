//keel-mobile/src/screens/tasks/TasksHomeScreen.tsx

/**
 * ============================================================
 * TasksHomeScreen — SECTION OVERVIEW (LIVE DATA)
 * ============================================================
 *
 * DESIGN GOALS:
 * - Maritime logbook density
 * - Clear visual hierarchy
 * - Action is subtle, not dominant
 * - Inspector-safe, cadet-friendly
 *
 * UPDATES:
 * - Reads from SQLite 'task_records'
 * - Groups by 'categoryId' (Topic)
 * - Calculates real progress
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme, ProgressBar, ActivityIndicator } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelButton } from "../../components/ui/KeelButton";
import { useToast } from "../../components/toast/useToast";

// DB Imports
import { getAllTaskRecords, TaskRecord } from "../../db/tasks";

/**
 * Section Data derived from DB
 */
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

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // 1. Fetch all tasks
      const allTasks = getAllTaskRecords();

      if (allTasks.length === 0) {
        setSections([]);
        setLoading(false);
        return;
      }

      // 2. Group by Category (Topic)
      // We use a Map to aggregate counts
      const groups: Record<string, SectionData> = {};

      allTasks.forEach((task) => {
        // Fallback to "General" if category is missing from sync
        const catKey = task.categoryId || "General Tasks";
        
        if (!groups[catKey]) {
          groups[catKey] = {
            key: catKey,
            title: catKey,
            total: 0,
            completed: 0,
            progress: 0
          };
        }

        groups[catKey].total += 1;

        // Check completion status
        // Adjust this check if your completion status is different (e.g. 'SIGNED_OFF')
        if (task.status === "COMPLETED") {
          groups[catKey].completed += 1;
        }
      });

      // 3. Convert to Array & Calculate Progress %
      const sectionList = Object.values(groups).map(group => ({
        ...group,
        progress: group.total === 0 ? 0 : group.completed / group.total
      }));

      // 4. Sort alphabetically or by some other logic if needed
      sectionList.sort((a, b) => a.title.localeCompare(b.title));

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
      {/* ======================================================== */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Tasks
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Training Record Book
        </Text>
      </View>

      {/* ======================================================== */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ opacity: 0.5 }}>No tasks found.</Text>
              <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 4 }}>
                Run "Data Sync" to fetch your TRB.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <KeelCard>
              <View style={styles.cardRow}>
                {/* ------------------------------------------------
                    Left status strip (visual state indicator)
                   ------------------------------------------------ */}
                <View style={styles.statusStripWrap}>
                  <View
                    style={[
                      styles.statusStrip,
                      { 
                        backgroundColor: item.progress === 1 
                          ? theme.colors.primary 
                          : item.progress > 0 
                            ? theme.colors.tertiary 
                            : theme.colors.surfaceVariant 
                      },
                    ]}
                  />
                </View>

                {/* ------------------------------------------------
                    Main content area
                   ------------------------------------------------ */}
                <View style={styles.cardContent}>
                  {/* Title + Action Row */}
                  <View style={styles.titleRow}>
                    <Text
                      variant="titleMedium"
                      style={styles.sectionTitle}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>

                    {/* Compact action chip */}
                    <KeelButton
                      mode="secondary"
                      onPress={() =>
                        navigation.navigate("TaskSection", {
                          sectionKey: item.key, // Sending Category Name as Key
                          sectionTitle: item.title,
                        })
                      }
                    >
                      Open
                    </KeelButton>
                  </View>

                  {/* Meta text */}
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Progress: {item.completed} / {item.total} tasks
                  </Text>

                  {/* Progress bar */}
                  <ProgressBar
                    progress={item.progress}
                    color={theme.colors.primary}
                    style={styles.progress}
                  />
                </View>
              </View>
            </KeelCard>
          )}
        />
      )}
    </KeelScreen>
  );
}

/**
 * ============================================================
 * Styles — Tight, Logbook-Grade
 * ============================================================
 */
const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
  },
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statusStripWrap: {
    paddingVertical: 10,
  },
  statusStrip: {
    width: 4,
    flex: 1,
    borderRadius: 2,
  },

  cardContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
});