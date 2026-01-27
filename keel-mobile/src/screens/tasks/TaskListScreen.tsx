//keel-mobile/src/screens/tasks/TaskListScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ✅ Import

import { KeelScreen } from "../../components/ui/KeelScreen";
import { TaskRecord } from "../../db/tasks";

type RouteParams = { groupTitle: string; tasks: TaskRecord[]; };

export default function TaskListScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets(); // ✅ Hook
  const { groupTitle, tasks } = route.params as RouteParams;
  const [activeTab, setActiveTab] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");

  const visibleTasks = tasks.sort((a, b) => a.taskKey.localeCompare(b.taskKey, undefined, { numeric: true })); 

  const renderItem = ({ item, index }: { item: TaskRecord; index: number }) => {
    const isLast = index === visibleTasks.length - 1;
    let iconName = "checkbox-blank-circle-outline";
    let iconColor = theme.colors.outline;
    let iconBg = "transparent";

    if (item.status === "COMPLETED") {
        iconName = "check";
        iconColor = "white";
        iconBg = "#10B981"; 
    } else if (item.status === "IN_PROGRESS") {
        iconName = "circle-slice-5";
        iconColor = "#F59E0B"; 
        iconBg = "#FEF3C7"; 
    }

    return (
      <View style={styles.stepContainer}>
        <View style={styles.timelineCol}>
             <View style={[styles.stepIcon, { 
                 backgroundColor: iconBg, 
                 borderColor: item.status === 'NOT_STARTED' ? theme.colors.outline : 'transparent', 
                 borderWidth: item.status === 'NOT_STARTED' ? 2 : 0 
             }]}>
                 {item.status !== 'NOT_STARTED' && <IconButton icon={iconName} iconColor={iconColor} size={14} style={{ margin: 0 }} />}
             </View>
             {!isLast && <View style={[styles.stepLine, { backgroundColor: theme.colors.outline + "40" }]} />}
        </View>

        <TouchableOpacity 
            style={[styles.stepCard, { borderColor: theme.colors.outline }]}
            onPress={() => navigation.navigate("TaskDetails", { taskKey: item.taskKey })}
            activeOpacity={0.7}
        >
             <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>{item.taskKey}</Text>
                        {item.frequency && (
                             <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>{item.frequency.replace('_', ' ')}</Text>
                        )}
                    </View>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', lineHeight: 20 }}>{item.taskDescription}</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={theme.colors.outline} />
             </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeelScreen style={{ paddingHorizontal: 16 }}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginLeft: -12 }} />
        <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>Section Task</Text>
            <Text variant="titleLarge" style={styles.title} numberOfLines={1}>{groupTitle}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Text onPress={() => setActiveTab("MANDATORY")} style={[styles.tabItem, activeTab === "MANDATORY" && { color: theme.colors.primary, borderBottomColor: theme.colors.primary }]}>
          Mandatory ({visibleTasks.length})
        </Text>
        <Text onPress={() => setActiveTab("OPTIONAL")} style={[styles.tabItem, activeTab === "OPTIONAL" && { color: theme.colors.primary, borderBottomColor: theme.colors.primary }]}>
          Optional (0)
        </Text>
      </View>

      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        // ✅ FIX: Ensure list scrolls ABOVE the system nav bar
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 16 }}
      />
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 4 },
  title: { fontWeight: "800" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 8 },
  tabItem: { flex: 1, textAlign: "center", paddingVertical: 10, fontWeight: "600", borderBottomWidth: 2, borderColor: "transparent", color: "#6B7280" },
  stepContainer: { flexDirection: 'row', minHeight: 70 },
  timelineCol: { width: 40, alignItems: 'center' },
  stepIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: 12 },
  stepLine: { flex: 1, width: 2, marginVertical: 0 },
  stepCard: { flex: 1, marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'white', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
});