//keel-mobile/src/components/home/ComplianceTrend.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, Button, useTheme } from "react-native-paper";
import { DailyLogRecord } from "../../db/dailyLogs";
import { AlertCircle, ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

interface Props {
  logs: DailyLogRecord[];
}

export const ComplianceTrend = ({ logs }: Props) => {
  const navigation = useNavigation<any>();
  
  // 1. Generate last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // 2. Identify the day with the lowest rest hours (The "Fix" Target)
  const violationDay = [...logs]
    .filter(l => last7Days.includes(l.date) && l.totalRest < 10)
    .sort((a, b) => a.totalRest - b.totalRest)[0];

  const handleFixTap = () => {
    if (violationDay) {
      // Navigate to Daily tab and pass the specific date
      navigation.navigate("Daily", { screen: "DailyLog", params: { date: violationDay.date } });
    }
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <View>
            <Text variant="titleSmall" style={styles.title}>Weekly Rest Hours</Text>
            <Text variant="labelSmall" style={{ color: '#9CA3AF' }}>STCW Min: 10h</Text>
        </View>
        
        {/* ✅ ONE-TAP FIX BUTTON: Only shows if a violation exists */}
        {violationDay && (
            <TouchableOpacity style={styles.fixButton} onPress={handleFixTap}>
                <AlertCircle size={14} color="#B91C1C" strokeWidth={3} />
                <Text style={styles.fixButtonText}>Fix Lowest</Text>
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.chartArea}>
        {last7Days.map((dateStr) => {
          const log = logs.find(l => l.date === dateStr);
          const restHours = log ? log.totalRest : 0;
          const isViolation = restHours < 10 && log; 
          const barHeight = (Math.min(restHours, 24) / 24) * 100;
          
          return (
            <View key={dateStr} style={styles.barColumn}>
              <Text style={[
                styles.hourValue, 
                { color: isViolation ? '#B91C1C' : log ? '#059669' : '#D1D5DB' }
              ]}>
                {log ? `${restHours}h` : '-'}
              </Text>

              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${barHeight}%`, 
                      backgroundColor: isViolation ? '#B91C1C' : log ? '#10B981' : '#E5E7EB' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.dayLabel}>{dateStr.split('-')[2]}</Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, {backgroundColor: '#10B981'}]} />
          <Text variant="labelSmall">Compliant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, {backgroundColor: '#B91C1C'}]} />
          <Text variant="labelSmall">Violation</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 24, backgroundColor: 'white', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  title: { fontWeight: '900', color: '#111827', fontSize: 15 },
  
  // Fix Button Styles
  fixButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FEF2F2', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  fixButtonText: { 
    color: '#B91C1C', 
    fontSize: 11, 
    fontWeight: '800', 
    marginLeft: 6 
  },

  chartArea: { flexDirection: 'row', justifyContent: 'space-between', height: 130, alignItems: 'flex-end' },
  barColumn: { alignItems: 'center', flex: 1 },
  hourValue: { fontSize: 9, fontWeight: '800', marginBottom: 6 },
  barContainer: { height: 80, width: 14, backgroundColor: '#F3F4F6', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 6 },
  dayLabel: { fontSize: 10, marginTop: 8, color: '#9CA3AF', fontWeight: '700' },
  legend: { 
    flexDirection: 'row', 
    marginTop: 20, 
    gap: 16, 
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    paddingTop: 12
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 }
});