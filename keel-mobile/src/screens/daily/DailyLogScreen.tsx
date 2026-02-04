//keel-mobile/src/screens/daily/DailyLogScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import { 
  View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, 
  TouchableOpacity, RefreshControl 
} from "react-native";
import { Text, Surface, IconButton, useTheme, TextInput, ActivityIndicator, Divider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ShieldCheck, Anchor, HardHat, Coffee, Wrench, History, BookOpen, Plus, Trash2, Clock, CheckCircle2
} from "lucide-react-native";
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

// --- UI COMPONENTS ---
import { KeelScreen } from "../../components/ui/KeelScreen";
import { useToast } from "../../components/toast/useToast";
import { useAuth } from "../../auth/AuthContext";
import { DailyHistoryList } from "../../components/daily/DailyHistoryList";
import YesNoCapsule from "../../components/common/YesNoCapsule";

// --- DEPARTMENTAL FIELD COMPONENTS ---
import DeckLogFields from "../../components/daily/departments/DeckLogFields";
import EngineLogFields from "../../components/daily/departments/EngineLogFields";
import EtoLogFields from "../../components/daily/departments/EtoLogFields";
import CateringLogFields from "../../components/daily/departments/CateringLogFields";

// --- DATABASE LOGIC ---
import { 
  getLogByDate, upsertDailyLog, ensureDailyLogsTable, getAllDailyLogs, deleteDailyLogById 
} from "../../db/dailyLogs";

const getTodayStr = () => new Date().toISOString().split('T')[0];

interface ActivityBlock {
  id: string;
  start: string;
  end: string;
  activity: string;
}

/**
 * DAILY LOG SCREEN - REDESIGNED
 * Focus: Structured activity logging for professional TRB audit trails.
 */
export default function DailyLogScreen() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const primaryBrand = "#3194A0";

  // --- UI STATE ---
  const [viewMode, setViewMode] = useState<"ENTRY" | "HISTORY">("ENTRY");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [hasChanges, setHasChanges] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // --- LOG DATA ---
  const [remarks, setRemarks] = useState("");
  const [p1, setP1] = useState(""); 
  const [p2, setP2] = useState(""); 
  const [activities, setActivities] = useState<ActivityBlock[]>([]);

  // --- COMPLIANCE & DEPT STATES ---
  const [stcwRestHoursOk, setStcwRestHoursOk] = useState(true);
  const [isLookout, setIsLookout] = useState(false);
  const [umsStatus, setUmsStatus] = useState(true);
  const [hygieneCheck, setHygieneCheck] = useState(true);

  useEffect(() => { ensureDailyLogsTable(); }, []);

  useFocusEffect(
    useCallback(() => {
      viewMode === "ENTRY" ? loadEntry(selectedDate) : refreshHistory();
    }, [selectedDate, viewMode])
  );

  const refreshHistory = () => {
    const logs = getAllDailyLogs();
    setHistoryLogs((logs || []).map(l => ({ ...l, id: String(l.id) })));
  };

  const loadEntry = (date: string) => {
    const record = getLogByDate(date);
    if (record) {
      setRemarks(record.remarks || "");
      setP1(record.positionLat || "");
      setP2(record.positionLong || "");
      try {
        const parsed = JSON.parse(record.activityJson);
        setActivities(Array.isArray(parsed) ? parsed : []);
      } catch { setActivities([]); }
    } else {
      setRemarks(""); setP1(""); setP2(""); setActivities([]);
    }
    setHasChanges(false);
  };

  const addActivity = () => {
    const newAct: ActivityBlock = { 
        id: `block_${Date.now()}_${Math.random().toString(36).substring(7)}`, 
        start: "08:00", 
        end: "12:00", 
        activity: "" 
    };
    setActivities([...activities, newAct]);
    setHasChanges(true);
  };

  const handleDeleteLog = (id: string) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      deleteDailyLogById(String(numericId));
      refreshHistory();
      toast.success("Log Deleted");
    }
  };

  const handleSave = () => {
    upsertDailyLog({
      date: selectedDate,
      activityJson: JSON.stringify(activities),
      remarks,
      positionLat: p1,
      positionLong: p2,
      totalRest: 0, totalWork: 0, totalWatch: 0, totalSteering: 0 
    });
    setHasChanges(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success("Ship's Log Committed");
  };

  /**
   * THE DYNAMIC DEPARTMENT ENGINE
   * Pass specific props to the correct department file.
   */
  const renderDeptFields = () => {
    const props = { 
      p1, setP1: (t:string)=>{setP1(t); setHasChanges(true)}, 
      p2, setP2: (t:string)=>{setP2(t); setHasChanges(true)} 
    };

    switch(user?.department) {
      case 'DECK': 
        return <DeckLogFields {...props} onGps={()=>{}} isLookout={isLookout} setIsLookout={(v)=>{setIsLookout(v); setHasChanges(true)}} />;
      case 'ENGINE': 
        return <EngineLogFields {...props} umsStatus={umsStatus} setUmsStatus={(v)=>{setUmsStatus(v); setHasChanges(true)}} />;
      case 'ETO': 
        return <EtoLogFields {...props} umsStatus={umsStatus} setUmsStatus={(v)=>{setUmsStatus(v); setHasChanges(true)}} />;
      case 'CATERING': 
        return <CateringLogFields {...props} hygieneCheck={hygieneCheck} setHygieneCheck={(v)=>{setHygieneCheck(v); setHasChanges(true)}} />;
      default: 
        return <Text style={{ textAlign: 'center', padding: 20 }}>Please set Department in Settings</Text>;
    }
  };

  return (
    <KeelScreen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* --- HUD HEADER --- */}
        <Surface style={styles.header} elevation={3}>
          <View style={styles.headerTop}>
            <View style={styles.deptBadge}>
               {user?.department === 'ENGINE' && <HardHat size={22} color={primaryBrand} />}
               {user?.department === 'DECK' && <Anchor size={22} color={primaryBrand} />}
               {user?.department === 'ETO' && <Wrench size={22} color={primaryBrand} />}
               {user?.department === 'CATERING' && <Coffee size={22} color={primaryBrand} />}
               <Text style={styles.deptText}>{user?.department} JOURNAL</Text>
            </View>
            <View style={styles.dateNav}>
               <IconButton icon="chevron-left" size={20} onPress={() => {
                 const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);
               }} />
               <Text style={styles.dateLabel}>{selectedDate}</Text>
               <IconButton icon="chevron-right" size={20} onPress={() => {
                 const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);
               }} />
            </View>
          </View>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setViewMode("ENTRY")} style={[styles.tab, viewMode === "ENTRY" && styles.activeTab]}>
              <BookOpen size={16} color={viewMode === "ENTRY" ? primaryBrand : "#94A3B8"} />
              <Text style={[styles.tabText, viewMode === "ENTRY" && { color: primaryBrand }]}>JOURNAL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode("HISTORY")} style={[styles.tab, viewMode === "HISTORY" && styles.activeTab]}>
              <History size={16} color={viewMode === "HISTORY" ? primaryBrand : "#94A3B8"} />
              <Text style={[styles.tabText, viewMode === "HISTORY" && { color: primaryBrand }]}>HISTORY</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {viewMode === "ENTRY" ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }}>
            
            {/* --- COMPLIANCE CARD --- */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.sectionHeaderInner}>
                <CheckCircle2 size={16} color={primaryBrand} />
                <Text style={styles.cardTitle}>REGULATORY COMPLIANCE</Text>
              </View>
              <View style={styles.capsuleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.capsuleLabel}>REST HOURS COMPLIED?</Text>
                  <Text style={styles.capsuleSub}>STCW Regulation VIII/1</Text>
                </View>
                <YesNoCapsule value={stcwRestHoursOk} onChange={(v) => {setStcwRestHoursOk(v); setHasChanges(true)}} />
              </View>
            </Surface>

            {/* --- DEPARTMENTAL CARD --- */}
            <Surface style={styles.card} elevation={1}>
              {renderDeptFields()}
            </Surface>

            {/* --- ACTIVITY BLOCKS --- */}
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>WORK & TRAINING BLOCKS</Text>
               <TouchableOpacity style={styles.addBtn} onPress={addActivity}>
                  <Plus size={16} color="white" />
                  <Text style={styles.addBtnText}>ADD BLOCK</Text>
               </TouchableOpacity>
            </View>

            {activities.map((act, index) => (
              <Surface key={act.id} style={styles.activityCard} elevation={1}>
                <View style={styles.actRow}>
                  <TextInput mode="flat" label="From" value={act.start} style={styles.timeInput} dense onChangeText={(t) => {
                    const n = [...activities]; n[index].start = t; setActivities(n); setHasChanges(true);
                  }} />
                  <TextInput mode="flat" label="To" value={act.end} style={styles.timeInput} dense onChangeText={(t) => {
                    const n = [...activities]; n[index].end = t; setActivities(n); setHasChanges(true);
                  }} />
                  <IconButton icon="trash-can-outline" iconColor={theme.colors.error} size={20} onPress={() => {
                    setActivities(activities.filter(a => a.id !== act.id)); setHasChanges(true);
                  }} />
                </View>
                <TextInput 
                  mode="outlined" 
                  placeholder="Task Description..." 
                  value={act.activity}
                  onChangeText={(t) => {
                    const newActs = [...activities];
                    newActs[index].activity = t;
                    setActivities(newActs);
                    setHasChanges(true);
                  }}
                  style={styles.actDesc}
                  outlineStyle={{ borderRadius: 12 }}
                />
              </Surface>
            ))}

            <Surface style={[styles.card, { marginTop: 24 }]} elevation={1}>
              <Text style={styles.cardTitle}>NARRATIVE JOURNAL</Text>
              <TextInput 
                multiline value={remarks} onChangeText={(t)=>{setRemarks(t); setHasChanges(true)}} 
                placeholder="Daily summary..." 
                style={styles.remarks} underlineColor="transparent" 
              />
            </Surface>

          </ScrollView>
        ) : (
          <DailyHistoryList logs={historyLogs} onDelete={handleDeleteLog} onSelectDate={(d) => { setSelectedDate(d); setViewMode("ENTRY"); }} />
        )}

        {hasChanges && (
          <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <ShieldCheck color="white" size={24} />
              <Text style={styles.saveText}>COMMIT DAILY LOG</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36, backgroundColor: 'white' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  deptBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deptText: { fontWeight: '900', fontSize: 13, color: '#64748B', letterSpacing: 1.2 },
  dateNav: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontWeight: '900', color: '#3194A0', fontSize: 14 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderBottomWidth: 5, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#3194A0' },
  tabText: { fontWeight: '900', fontSize: 12, color: '#94A3B8', letterSpacing: 1 },

  card: { borderRadius: 28, padding: 20, marginBottom: 16, backgroundColor: 'white' },
  sectionHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 10, fontWeight: '900', color: '#3194A0', letterSpacing: 1.5 },
  
  capsuleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(148, 163, 184, 0.08)', padding: 16, borderRadius: 24 },
  capsuleLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  capsuleSub: { fontSize: 10, color: '#64748B' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  addBtn: { backgroundColor: '#3194A0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, gap: 6 },
  addBtnText: { color: 'white', fontWeight: '900', fontSize: 11 },

  activityCard: { borderRadius: 28, padding: 16, marginBottom: 16, borderLeftWidth: 10, borderLeftColor: '#3194A0', backgroundColor: 'white' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  timeInput: { flex: 1, backgroundColor: 'transparent', height: 45 },
  actDesc: { backgroundColor: 'transparent', fontSize: 15 },
  remarks: { backgroundColor: 'transparent', minHeight: 120, fontSize: 16 },

  fab: { position: 'absolute', left: 24, right: 24 },
  saveBtn: { height: 72, backgroundColor: '#3194A0', borderRadius: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 12 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 17, letterSpacing: 1.5 }
});