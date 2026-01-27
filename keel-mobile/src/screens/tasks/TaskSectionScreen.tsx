//keel-mobile/src/screens/tasks/TaskSectionScreen.tsx

import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { IconButton, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ✅ Import this

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelProgressBar } from "../../components/ui/KeelProgressBar"; 
import { getAllTaskRecords, TaskRecord } from "../../db/tasks";

type RouteParams = { sectionKey: string; sectionTitle: string; };
type TaskGroup = { title: string; total: number; completed: number; tasks: TaskRecord[]; };

export default function TaskSectionScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets(); // ✅ Hook
  const { sectionKey, sectionTitle } = route.params as RouteParams;

  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadTasks(); }, [sectionKey]));

  const loadTasks = async () => {
    try {
      const allTasks = getAllTaskRecords();
      const targetKey = String(sectionKey).trim();
      
      const sectionTasks = allTasks.filter(t => {
        const tSec = t.sectionId ? String(t.sectionId).trim() : "General";
        return tSec === targetKey || tSec.replace("Function ", "") === targetKey;
      });

      const grouped: Record<string, TaskGroup> = {};
      sectionTasks.forEach(task => {
        const title = task.taskTitle || "Untitled Task";
        if (!grouped[title]) grouped[title] = { title, total: 0, completed: 0, tasks: [] };
        grouped[title].tasks.push(task);
        grouped[title].total++;
        if (task.status === "COMPLETED") grouped[title].completed++;
      });
      setGroups(Object.values(grouped));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const renderGroup = ({ item }: { item: TaskGroup }) => {
    const progress = item.total > 0 ? item.completed / item.total : 0;
    return (
      <KeelCard 
        onPress={() => navigation.navigate("TaskList", { groupTitle: item.title, tasks: item.tasks })}
        style={styles.card}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <IconButton icon="folder-outline" iconColor={theme.colors.primary} size={26} style={{ margin: 0 }} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={styles.row}>
                <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={1}>{item.title}</Text>
                <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '800' }}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={{ marginTop: 10 }}>
                 <KeelProgressBar progress={progress} height={6} />
                 <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, fontWeight: '500' }}>{item.completed} of {item.total} Completed</Text>
            </View>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={theme.colors.outline} style={{ marginRight: -8 }} />
        </View>
      </KeelCard>
    );
  };

  return (
    <KeelScreen style={{ paddingHorizontal: 16 }}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginLeft: -12 }} size={24}/>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={1}>{sectionTitle}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.title}
          renderItem={renderGroup}
          // ✅ FIX: Add bottom inset so content isn't hidden behind Android Nav Bar
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <View style={styles.emptyContainer}>
                 <IconButton icon="folder-open-outline" size={64} iconColor={theme.colors.outline} />
                 <Text style={{ opacity: 0.5, marginTop: 8 }}>No task groups found.</Text>
             </View>
          }
        />
      )}
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  title: { fontWeight: "800", flex: 1 },
  card: { marginBottom: 16, borderRadius: 16, borderWidth: 0 },
  cardInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.6 }
});