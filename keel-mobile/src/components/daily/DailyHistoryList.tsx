//keel-mobile/src/components/daily/DailyHistoryList.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity, Text as RNText, Alert } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { DailyLogRecord } from "../../db/dailyLogs";

interface Props {
  logs: DailyLogRecord[];
  onSelectDate: (date: string) => void;
  onDelete: (id: string) => void; // ✅ Added onDelete
}

export const DailyHistoryList = ({ logs, onSelectDate, onDelete }: Props) => {
  const getBlockColor = (val: number) => {
    if (val === 1) return "#F59E0B"; // Work
    if (val === 2) return "#3B82F6"; // Watch
    return "#10B981"; // Rest
  };

  const handleLongPress = (log: DailyLogRecord) => {
    Alert.alert(
      "Delete Daily Log",
      `Are you sure you want to delete all records for ${log.date}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => onDelete(log.id) 
        }
      ]
    );
  };

  const renderTimelinePreview = (json: string) => {
    try {
      const data: number[] = JSON.parse(json);
      return (
        <View style={styles.miniTimeline}>
          {data.map((v, i) => (
            <View 
              key={i} 
              style={[styles.miniBlock, { backgroundColor: getBlockColor(v) }]} 
            />
          ))}
        </View>
      );
    } catch {
      return <View style={[styles.miniTimeline, { backgroundColor: '#E5E7EB' }]} />;
    }
  };

  return (
    <View style={styles.container}>
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <IconButton icon="calendar-blank" size={48} style={{ opacity: 0.3 }} />
          <Text variant="bodyMedium" style={{ opacity: 0.5 }}>No logs found in history.</Text>
        </View>
      ) : (
        logs.map((log) => {
          const isCompliant = log.totalRest >= 10;
          return (
            <TouchableOpacity 
              key={log.id} 
              onPress={() => onSelectDate(log.date)}
              onLongPress={() => handleLongPress(log)} // ✅ Added Long Press
              activeOpacity={0.7}
              delayLongPress={500}
            >
              <Surface style={styles.logCard} elevation={1}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.dateText}>{log.date}</Text>
                    <Text variant="bodySmall" style={{ color: '#6B7280' }}>
                      {log.positionLat ? `Pos: ${log.positionLat}` : "No position logged"}
                    </Text>
                  </View>
                  <View style={[styles.complianceBadge, { backgroundColor: isCompliant ? '#D1FAE5' : '#FEE2E2' }]}>
                    <RNText style={{ fontSize: 10, fontWeight: '800', color: isCompliant ? '#065F46' : '#991B1B' }}>
                      {isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
                    </RNText>
                  </View>
                </View>

                {renderTimelinePreview(log.activityJson)}

                <View style={styles.cardFooter}>
                  <View style={styles.stat}>
                    <RNText style={styles.statLabel}>REST</RNText>
                    <RNText style={styles.statValue}>{log.totalRest}h</RNText>
                  </View>
                  <View style={styles.stat}>
                    <RNText style={styles.statLabel}>WORK</RNText>
                    <RNText style={styles.statValue}>{log.totalWork}h</RNText>
                  </View>
                  <View style={styles.stat}>
                    <RNText style={styles.statLabel}>WATCH</RNText>
                    <RNText style={styles.statValue}>{log.totalWatch}h</RNText>
                  </View>
                </View>
                
                <RNText style={styles.hintText}>Hold card to delete</RNText>
              </Surface>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  emptyState: { alignItems: 'center', marginTop: 60, width: '100%' },
  logCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  dateText: { fontWeight: '800', color: '#1F2937' },
  complianceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniTimeline: { 
    flexDirection: 'row', 
    height: 14, 
    borderRadius: 4, 
    overflow: 'hidden', 
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  miniBlock: { flex: 1, height: '100%' },
  cardFooter: { flexDirection: 'row', marginTop: 12, gap: 20 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#374151' },
  hintText: { fontSize: 9, color: '#D1D5DB', textAlign: 'right', marginTop: 8, fontStyle: 'italic' }
});