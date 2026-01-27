//keel-mobile/src/screens/tasks/TasksHomeScreen.tsx

/**
 * ============================================================
 * TASKS DASHBOARD — REDESIGN
 * ============================================================
 * * CONCEPT: "The Command Center"
 * - Grid layout for Functions (Tiles)
 * - Hero card for Global Progress
 * - High-contrast, maritime aesthetics
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Dimensions } from "react-native";
import { Text, useTheme, IconButton, ActivityIndicator, TouchableRipple } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelProgressBar } from "../../components/ui/KeelProgressBar";
import { getAllTaskRecords, TaskRecord } from "../../db/tasks";

// --- MAPPINGS ---
// Maps Section ID (Function) to Icon & Color
const FUNCTION_META: Record<string, { icon: string; color: string; label: string }> = {
  '1': { icon: 'compass-outline', color: '#3194A0', label: 'Navigation' },
  'Function 1': { icon: 'compass-outline', color: '#3194A0', label: 'Navigation' },
  
  '2': { icon: 'package-variant-closed', color: '#F59E0B', label: 'Cargo Handling' },
  'Function 2': { icon: 'package-variant-closed', color: '#F59E0B', label: 'Cargo Handling' },
  
  '3': { icon: 'ferry', color: '#10B981', label: 'Ship Ops & Care' },
  'Function 3': { icon: 'ferry', color: '#10B981', label: 'Ship Ops & Care' },
  
  '4': { icon: 'engine', color: '#EF4444', label: 'Marine Engineering' },
  'Function 4': { icon: 'engine', color: '#EF4444', label: 'Marine Engineering' },
  
  '5': { icon: 'flash-outline', color: '#8B5CF6', label: 'Electrical' },
  'Function 5': { icon: 'flash-outline', color: '#8B5CF6', label: 'Electrical' },
  
  '6': { icon: 'tools', color: '#6B7280', label: 'Maintenance' },
  'Function 6': { icon: 'tools', color: '#6B7280', label: 'Maintenance' },
  
  '7': { icon: 'radio-handheld', color: '#EC4899', label: 'Radio Comms' },
  'Function 7': { icon: 'radio-handheld', color: '#EC4899', label: 'Radio Comms' },
};

type FunctionStat = {
  key: string;
  title: string;
  icon: string;
  color: string;
  total: number;
  completed: number;
  progress: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - (GAP * 3)) / NUM_COLUMNS; // Calculate exact tile width

export default function TasksHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<FunctionStat[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
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
        setStats([]);
        setLoading(false);
        return;
      }

      // 1. Group by Function (Section)
      const groups: Record<string, FunctionStat> = {};
      let totalTasks = 0;
      let totalCompleted = 0;

      allTasks.forEach((task) => {
        // Normalize Section Key (e.g. "Function 1" -> "1")
        const rawSec = task.sectionId || "General";
        // Try to find a clean key if "Function X" is used
        const cleanKey = rawSec.replace('Function ', ''); 
        
        const meta = FUNCTION_META[rawSec] || FUNCTION_META[cleanKey] || { 
            icon: 'text-box-check-outline', 
            color: theme.colors.primary, 
            label: rawSec 
        };

        if (!groups[rawSec]) {
          groups[rawSec] = {
            key: rawSec,
            title: meta.label,
            icon: meta.icon,
            color: meta.color,
            total: 0,
            completed: 0,
            progress: 0
          };
        }

        groups[rawSec].total += 1;
        totalTasks += 1;

        if (task.status === "COMPLETED") {
          groups[rawSec].completed += 1;
          totalCompleted += 1;
        }
      });

      // 2. Calculate Progress
      const list = Object.values(groups).map(g => ({
        ...g,
        progress: g.total === 0 ? 0 : g.completed / g.total
      }));

      // Sort by Function Number
      list.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

      setStats(list);
      setGlobalProgress(totalTasks === 0 ? 0 : totalCompleted / totalTasks);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HERO CARD ---
  const renderHero = () => (
    <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <View style={styles.heroRow}>
        <View>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            Overall Competency
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Training Record Book Progress
          </Text>
        </View>
        <Text variant="displaySmall" style={{ fontWeight: '800', color: theme.colors.primary }}>
          {Math.round(globalProgress * 100)}%
        </Text>
      </View>
      <KeelProgressBar progress={globalProgress} height={10} style={{ marginTop: 16 }} />
    </View>
  );

  // --- RENDER GRID TILE ---
  const renderTile = ({ item }: { item: FunctionStat }) => (
    <View style={[styles.tileContainer, { width: ITEM_WIDTH }]}>
      <TouchableRipple
        onPress={() => navigation.navigate("TaskSection", { 
            sectionKey: item.key, 
            sectionTitle: item.title 
        })}
        style={[styles.tile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        rippleColor={item.color + "20"}
      >
        <View style={styles.tileContent}>
          {/* Header: Icon + Percent */}
          <View style={styles.tileHeader}>
            <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                <IconButton icon={item.icon} iconColor={item.color} size={24} style={{ margin: 0 }} />
            </View>
            <Text variant="labelLarge" style={{ fontWeight: '700', color: item.color }}>
                {Math.round(item.progress * 100)}%
            </Text>
          </View>

          {/* Title */}
          <Text variant="titleSmall" style={styles.tileTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Footer: Counter + Bar */}
          <View style={styles.tileFooter}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
                {item.completed} / {item.total} Tasks
            </Text>
            <KeelProgressBar 
                progress={item.progress} 
                height={4} 
                color={item.color} 
                trackColor={item.color + "20"} 
            />
          </View>
        </View>
      </TouchableRipple>
    </View>
  );

  return (
    <KeelScreen style={{ paddingHorizontal: GAP }}>
      {/* Header Title */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.pageTitle}>Tasks</Text>
        <IconButton icon="sync" size={20} onPress={loadData} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={stats}
          keyExtractor={(item) => item.key}
          numColumns={NUM_COLUMNS}
          ListHeaderComponent={renderHero}
          renderItem={renderTile}
          contentContainerStyle={{ paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>
                No tasks found. Please sync.
            </Text>
          }
        />
      )}
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  pageTitle: { fontWeight: '800' },
  
  // Hero Card
  heroCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    // Soft Shadow
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  // Grid Tile
  tileContainer: { marginBottom: 12 },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    height: 160, // Fixed height for uniformity
    overflow: 'hidden'
  },
  tileContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { borderRadius: 8, padding: 0, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  tileTitle: { fontWeight: '700', marginTop: 8, flex: 1 }, // Pushes content
  tileFooter: { justifyContent: 'flex-end' },
});