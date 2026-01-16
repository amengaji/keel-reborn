//keel-mobile/src/screens/TaskListScreen.tsx

/**
 * ============================================================
 * Task List Screen (SQLite-backed)
 * ============================================================
 *
 * PURPOSE:
 * - Display all training tasks
 * - Load tasks from local SQLite
 * - Preserve existing UI & navigation
 *
 * IMPORTANT:
 * - No custom props added to KeelCard
 * - Status rendered inside card body
 * - Offline-first
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelCard } from "../components/ui/KeelCard";
import { KeelButton } from "../components/ui/KeelButton";
import { useNavigation } from "@react-navigation/native";
import { useToast } from "../components/toast/useToast";

import {
  ensureSeedTasksExist,
  getAllTaskRecords,
  TaskRecord,
} from "../db/tasks";

/**
 * ------------------------------------------------------------
 * Helper: map taskKey → numeric id
 * ------------------------------------------------------------
 */
function mapTaskKeyToId(taskKey: string): number {
  const parts = taskKey.split(".");
  const n = Number(parts[1]);
  return Number.isFinite(n) ? n : 0;
}

export default function TaskListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const toast = useToast();

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  // ------------------------------------------------------------
  // Load tasks from SQLite
  // ------------------------------------------------------------
  useEffect(() => {
    try {
      ensureSeedTasksExist();
      const allTasks = getAllTaskRecords();
      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      toast.error("Failed to load tasks.");
    }
  }, [toast]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <KeelScreen>
      <Text variant="titleLarge" style={styles.title}>
        Tasks
      </Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const numericId = mapTaskKeyToId(item.taskKey);

          return (
            <KeelCard title={`Task ${numericId}`} subtitle={item.taskTitle}>
              {/* Task Status */}
              <Text
                variant="labelMedium"
                style={[
                  styles.status,
                  {
                    color:
                      item.status === "COMPLETED"
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {item.status === "COMPLETED"
                  ? "Completed"
                  : item.status === "IN_PROGRESS"
                  ? "In Progress"
                  : "Not Started"}
              </Text>

              {/* Action */}
              <View style={styles.cardFooter}>
                <KeelButton
                  mode="secondary"
                  onPress={() =>
                    navigation.navigate("TaskDetails", { id: numericId })
                  }
                >
                  Open
                </KeelButton>
              </View>
            </KeelCard>
          );
        }}
      />
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  status: {
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 12,
    alignItems: "flex-end",
  },
});
