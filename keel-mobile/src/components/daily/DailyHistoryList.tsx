//keel-mobile/src/components/daily/DailyHistoryList.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity, Text as RNText, Alert } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { DailyLogRecord } from "../../db/dailyLogs";

interface Props {
  logs: DailyLogRecord[];
  onSelectDate: (date: string) => void;
  onDelete: (id: string) => void;
}

export const DailyHistoryList = ({ logs, onSelectDate, onDelete }: Props) => {
  const getBlockColor = (val: number) => {
    switch(val) {
        case 1: return "#F59E0B"; // Work
        case 2: return "#3B82F6"; // Sea Watch
        case 3: return "#8B5CF6"; // Port Watch
        default: return "#10B981"; // Rest
    }
  };

  const handleLongPress = (log: DailyLogRecord) => {
    Alert.alert(
      "Delete Daily Log",
      `Are you sure you want to delete all records for ${log.date}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(log.id) }
      ]
    );
  };

  const renderTimelinePreview = (json: string) => {
    try {
      const data: number[] = JSON.parse(json);
      return (
        <View style={styles.miniTimeline}>
          {data.map((v, i) => (
            <View key={i} style={[styles.miniBlock, { backgroundColor: getBlockColor(v) }]} />
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
          
          // Calculate Split Watch Hours
          let seaWatch = 0;
          let portWatch = 0;
          try {
             const data: number[] = JSON.parse(log.activityJson);
             data.forEach(v => {
                 if (v === 2) seaWatch += 0.5;
                 if (v === 3) portWatch += 0.5;
             });
          } catch(e) {}

          return (
            <TouchableOpacity 
              key={log.id} 
              onPress={() => onSelectDate(log.date)}
              onLongPress={() => handleLongPress(log)}
              activeOpacity={0.7}
              delayLongPress={500}
            >
              <Surface style={styles.logCard} elevation={1}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.dateText}>{log.date}</Text>
                    <Text variant="bodySmall" style={{ color: '#6B7280' }}>
                      {log.positionLat ? `Lat: ${log.positionLat}` : "No position logged"}
                    </Text>
                  </View>
                  <View style={[styles.complianceBadge, { backgroundColor: isCompliant ? '#D1FAE5' : '#FEE2E2' }]}>
                    <RNText style={{ fontSize: 10, fontWeight: '800', color: isCompliant ? '#065F46' : '#991B1B' }}>
                      {isCompliant ? "COMPLIANT" : "VIOLATION"}
                    </RNText>
                  </View>
                </View>

                {renderTimelinePreview(log.activityJson)}

                <View style={styles.cardFooter}>
                  <View style={styles.statGroup}>
                    <RNText style={styles.statLabel}>REST</RNText>
                    <RNText style={styles.statValue}>{log.totalRest}h</RNText>
                  </View>
                  
                  <View style={styles.statGroup}>
                    <RNText style={styles.statLabel}>WORK</RNText>
                    <RNText style={styles.statValue}>{log.totalWork}h</RNText>
                  </View>

                  {/* Split Watch Display */}
                  <View style={styles.watchStats}>
                    {seaWatch > 0 && (
                        <View style={styles.miniStat}>
                            <View style={[styles.dot, {backgroundColor: '#3B82F6'}]} />
                            <RNText style={styles.watchValue}>{seaWatch}h Sea</RNText>
                        </View>
                    )}
                    {portWatch > 0 && (
                        <View style={styles.miniStat}>
                            <View style={[styles.dot, {backgroundColor: '#8B5CF6'}]} />
                            <RNText style={styles.watchValue}>{portWatch}h Port</RNText>
                        </View>
                    )}
                  </View>
                </View>
                
                <RNText style={styles.hintText}>Hold to delete</RNText>
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
  miniTimeline: { flexDirection: 'row', height: 14, borderRadius: 4, overflow: 'hidden', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  miniBlock: { flex: 1, height: '100%' },
  cardFooter: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  statGroup: { alignItems: 'flex-start' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#374151' },
  watchStats: { alignItems: 'flex-end', gap: 2 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  watchValue: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  hintText: { fontSize: 9, color: '#D1D5DB', textAlign: 'right', marginTop: 8, fontStyle: 'italic' }
});