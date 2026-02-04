import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, 
  TouchableOpacity, RefreshControl, Dimensions 
} from "react-native";
import { Text, Surface, IconButton, useTheme, TextInput, ActivityIndicator } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Navigation, Edit3, ShieldCheck, MapPin, Compass, 
  Activity, Clock, Calendar, ChevronLeft, ChevronRight, Zap
} from "lucide-react-native";
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelButton } from "../../components/ui/KeelButton";
import { useToast } from "../../components/toast/useToast";
import { useAuth } from "../../auth/AuthContext";
import { getDepartmentConfig } from "../../constants/logBrushes";
import { TimePainter } from "../../components/daily/TimePainter";
import { DailyHistoryList } from "../../components/daily/DailyHistoryList";
import { 
  getLogByDate, upsertDailyLog, ensureDailyLogsTable, 
  getAllDailyLogs, DailyLogRecord, deleteDailyLogById 
} from "../../db/dailyLogs";

const { width } = Dimensions.get('window');
const getTodayStr = () => new Date().toISOString().split('T')[0];

/**
 * DAILY LOG: COMMAND REDESIGN
 * A high-fidelity, department-adaptive interface.
 */
export default function DailyLogScreen() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { user } = useAuth();
  
  const config = useMemo(() => getDepartmentConfig(user?.department, user?.rank), [user?.department, user?.rank]);

  // --- UI STATE ---
  const [viewMode, setViewMode] = useState<"ENTRY" | "HISTORY">("ENTRY");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [refreshing, setRefreshing] = useState(false);
  
  // --- DATA STATE ---
  const [activityData, setActivityData] = useState<number[]>(new Array(48).fill(0));
  const [stats, setStats] = useState({ rest: 24, work: 0, watch: 0, tech: 0 });
  const [remarks, setRemarks] = useState("");
  const [p1, setP1] = useState(""); // Dynamic Param 1 (e.g. Lat / RPM)
  const [p2, setP2] = useState(""); // Dynamic Param 2 (e.g. Long / Temp)
  const [hasChanges, setHasChanges] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  useEffect(() => { ensureDailyLogsTable(); }, []);

  useFocusEffect(
    useCallback(() => {
      viewMode === "ENTRY" ? loadEntry(selectedDate) : loadHistory();
    }, [selectedDate, viewMode])
  );

  const loadEntry = (date: string) => {
    const record = getLogByDate(date);
    if (record) {
      const parsed = JSON.parse(record.activityJson);
      setActivityData(parsed);
      let r = 0, w = 0, wt = 0, st = 0;
      parsed.forEach((x: number) => { 
        if(x === 0) r += 0.5; if(x === 1) w += 0.5; 
        if(x === 2 || x === 3) wt += 0.5; if(x === 4) st += 0.5; 
      });
      setStats({ rest: r, work: w, watch: wt, tech: st });
      setRemarks(record.remarks || "");
      setP1(record.positionLat || "");
      setP2(record.positionLong || "");
    } else {
      setActivityData(new Array(48).fill(0));
      setStats({ rest: 24, work: 0, watch: 0, tech: 0 });
      setRemarks(""); setP1(""); setP2("");
    }
    setHasChanges(false);
  };

  const loadHistory = () => { /* Logic for list loading */ };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadEntry(selectedDate);
    setTimeout(() => { setRefreshing(false); toast.success("Records Refreshed"); }, 800);
  };

  const handleSave = () => {
    upsertDailyLog({
      date: selectedDate, activityJson: JSON.stringify(activityData),
      totalRest: stats.rest, totalWork: stats.work, totalWatch: stats.watch,
      totalSteering: stats.tech, remarks, positionLat: p1, positionLong: p2
    });
    setHasChanges(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success("Logbook Committed");
  };

  const handleGPSFix = async () => {
    setIsGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { toast.error("GPS Denied"); setIsGpsLoading(false); return; }
    const loc = await Location.getCurrentPositionAsync({});
    const latStr = `${Math.floor(Math.abs(loc.coords.latitude))}° ${((Math.abs(loc.coords.latitude) % 1) * 60).toFixed(1)}' ${loc.coords.latitude >= 0 ? "N" : "S"}`;
    const lonStr = `${Math.floor(Math.abs(loc.coords.longitude))}° ${((Math.abs(loc.coords.longitude) % 1) * 60).toFixed(1)}' ${loc.coords.longitude >= 0 ? "E" : "W"}`;
    setP1(latStr); setP2(lonStr);
    setHasChanges(true); setIsGpsLoading(false);
    toast.success("GPS Lock Acquired");
  };

  return (
    <KeelScreen style={{ paddingHorizontal: 0, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* --- DYNAMIC HEADER HUD --- */}
        <Surface style={styles.topHud} elevation={4}>
          <View style={styles.dateControl}>
            <IconButton icon="chevron-left" size={28} onPress={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);
            }} />
            <TouchableOpacity onPress={() => {/* Open Calendar */}} style={styles.dateBadge}>
              <Text style={styles.dateLabel}>{selectedDate === getTodayStr() ? "TODAY" : selectedDate}</Text>
            </TouchableOpacity>
            <IconButton icon="chevron-right" size={28} onPress={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);
            }} />
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => setViewMode("ENTRY")} style={[styles.tab, viewMode === "ENTRY" && { borderBottomColor: config.primary }]}>
              <Text style={[styles.tabText, viewMode === "ENTRY" && { color: config.primary }]}>JOURNAL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode("HISTORY")} style={[styles.tab, viewMode === "HISTORY" && { borderBottomColor: config.primary }]}>
              <Text style={[styles.tabText, viewMode === "HISTORY" && { color: config.primary }]}>HISTORY</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.primary} />}
        >
          {/* --- KPI NEON CARDS --- */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: stats.rest < 10 ? '#EF4444' : '#10B981' }]}>
              <Text style={styles.kpiLabel}>REST HOURS</Text>
              <Text style={[styles.kpiValue, { color: stats.rest < 10 ? '#EF4444' : '#10B981' }]}>{stats.rest}h</Text>
              <View style={styles.kpiIndicator}><Clock size={12} color="#94A3B8" /></View>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: config.primary }]}>
              <Text style={styles.kpiLabel}>{config.watchLabel}</Text>
              <Text style={[styles.kpiValue, { color: config.primary }]}>{stats.watch}h</Text>
              <View style={styles.kpiIndicator}><Activity size={12} color="#94A3B8" /></View>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.kpiLabel}>{config.techLabel}</Text>
              <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{stats.tech}h</Text>
              <View style={styles.kpiIndicator}><Zap size={12} color="#94A3B8" /></View>
            </View>
          </View>

          {/* --- TIMELINE AREA --- */}
          <Surface style={styles.timelineSection} elevation={1}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>24H ACTIVITY TIMELINE</Text>
              <IconButton icon="information-outline" size={16} />
            </View>
            <TimePainter 
              activityData={activityData} 
              onChange={(d, s) => { setActivityData(d); setStats({ ...stats, ...s }); setHasChanges(true); }} 
              isDeckCadet={user?.department === 'DECK'} 
            />
          </Surface>

          {/* --- PARAMETERS GRID --- */}
          <View style={styles.paramGrid}>
            <Surface style={styles.paramCard} elevation={2}>
              <View style={styles.paramHeader}>
                <Text style={styles.paramLabel}>{config.label1}</Text>
                {user?.department === 'DECK' && (
                  <TouchableOpacity onPress={handleGPSFix} disabled={isGpsLoading}>
                    {isGpsLoading ? <ActivityIndicator size={12} /> : <MapPin size={14} color={config.primary} />}
                  </TouchableOpacity>
                )}
              </View>
              <TextInput 
                value={p1} onChangeText={(t) => { setP1(t); setHasChanges(true); }}
                placeholder={config.placeholder1} style={styles.ghostInput}
                textColor={theme.colors.onSurface} underlineColor="transparent"
              />
              <Text style={styles.unitText}>{config.unit1}</Text>
            </Surface>

            <Surface style={styles.paramCard} elevation={2}>
              <View style={styles.paramHeader}>
                <Text style={styles.paramLabel}>{config.label2}</Text>
              </View>
              <TextInput 
                value={p2} onChangeText={(t) => { setP2(t); setHasChanges(true); }}
                placeholder={config.placeholder2} style={styles.ghostInput}
                textColor={theme.colors.onSurface} underlineColor="transparent"
              />
              <Text style={styles.unitText}>{config.unit2}</Text>
            </Surface>
          </View>

          {/* --- REMARKS BOX --- */}
          <Surface style={styles.remarksCard} elevation={1}>
            <View style={styles.paramHeader}>
              <Edit3 size={14} color="#94A3B8" />
              <Text style={styles.paramLabel}>JOURNAL REMARKS</Text>
            </View>
            <TextInput 
              multiline value={remarks} onChangeText={(t) => { setRemarks(t); setHasChanges(true); }}
              placeholder="Drills, machinery maintenance, or safety meetings..."
              style={styles.remarksInput} underlineColor="transparent"
            />
          </Surface>

        </ScrollView>

        {/* --- FLOATING ACTION DOCK --- */}
        {hasChanges && (
          <View style={[styles.actionDock, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity onPress={handleSave} style={[styles.commitBtn, { backgroundColor: config.primary }]}>
              <ShieldCheck size={20} color="white" />
              <Text style={styles.commitText}>COMMIT LOG ENTRY</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  topHud: { paddingHorizontal: 8, paddingTop: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  dateControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateBadge: { backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  dateLabel: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontWeight: '900', fontSize: 11, color: '#94A3B8' },
  
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, borderLeftWidth: 4 },
  kpiLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '900' },
  kpiIndicator: { position: 'absolute', right: 8, bottom: 8, opacity: 0.3 },

  timelineSection: { borderRadius: 24, padding: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },

  paramGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  paramCard: { flex: 1, borderRadius: 20, padding: 16 },
  paramHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  paramLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
  ghostInput: { backgroundColor: 'transparent', height: 40, fontSize: 18, fontWeight: '900', paddingHorizontal: 0 },
  unitText: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: -4 },

  remarksCard: { borderRadius: 24, padding: 20 },
  remarksInput: { backgroundColor: 'transparent', minHeight: 100, fontSize: 15, fontWeight: '500', paddingHorizontal: 0 },

  actionDock: { position: 'absolute', left: 20, right: 20 },
  commitBtn: { height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  commitText: { color: 'white', fontWeight: '900', letterSpacing: 1 }
});