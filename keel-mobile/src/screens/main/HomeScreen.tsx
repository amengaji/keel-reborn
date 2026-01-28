// keel-mobile/src/screens/HomeScreen.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Vibration, Animated } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
  Surface,
  Avatar,
  TextInput,
  ActivityIndicator,
  ProgressBar
} from "react-native-paper";
import { 
  Ship, Anchor, Activity, Clock,  
  RefreshCcw, Database, Info, CloudUpload, CheckCircle2
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from 'expo-secure-store';

import { KeelScreen } from "../../components/ui/KeelScreen";
import { useSeaService } from "../../sea-service/SeaServiceContext";
import { getSeaServiceSummary } from "../../sea-service/seaServiceStatus";
import { useDailyLogs } from "../../daily-logs/DailyLogsContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAllTaskRecords } from "../../db/tasks";
import { useAuth } from "../../auth/AuthContext";
import ComplianceIndicatorCard from "../../components/home/ComplianceIndicatorCard";
import api from "../../services/api";
import DateInputField from "../../components/inputs/DateInputField"; 
import { getAllDailyLogs, DailyLogRecord } from "../../db/dailyLogs";
import { ComplianceTrend } from "../../components/home/ComplianceTrend";
import { MilestoneModal } from "../../components/home/MilestoneModal";

import { SyncService } from "../../services/SyncService";
import { getPendingAttachments } from "../../db/taskAttachments";

let LAST_FOCUS_TIME = 0;

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user, updateUser, refreshUser } = useAuth();
  const { payload } = useSeaService();
  const { stcwComplianceStatus } = useDailyLogs();
  
  // State
  const [logs, setLogs] = useState<DailyLogRecord[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // Sync State
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTimestamps, setSyncTimestamps] = useState({ logs: '-', attachments: '-', tasks: '-' });
  const [syncProgress, setSyncProgress] = useState(0); 
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const updateLocalUI = useCallback(async () => {
    try {
      const allLogs = getAllDailyLogs() || [];
      const allTasks = getAllTaskRecords() || [];
      const pendingAttachments = getPendingAttachments() || [];
      
      const dirtyLogs = allLogs.filter(l => l.syncState === "DIRTY").length;
      const totalPending = dirtyLogs + pendingAttachments.length;
      
      setPendingSyncCount(totalPending);
      
      // Resumable progress logic: moves closer to 100% as totalPending decreases
      if (totalPending === 0) {
        setSyncProgress(1);
      } else {
        // Calculate a progress based on a hypothetical total (e.g., last known max)
        setSyncProgress(Math.max(0.1, 1 - (totalPending / 20))); 
      }

      const [tsLogs, tsFiles, tsTasks] = await Promise.all([
        SecureStore.getItemAsync('last_sync_logs'),
        SecureStore.getItemAsync('last_sync_attachments'),
        SecureStore.getItemAsync('last_sync_tasks')
      ]);

      setSyncTimestamps({
        logs: tsLogs ? new Date(tsLogs).toLocaleTimeString() : 'Never',
        attachments: tsFiles ? new Date(tsFiles).toLocaleTimeString() : 'Never',
        tasks: tsTasks ? new Date(tsTasks).toLocaleTimeString() : 'Never'
      });

      setLogs(allLogs);
      
      if (allLogs.length > 0) {
        const sortedLogs = [...allLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let cur = 0;
        for (const log of sortedLogs) {
          if (log.totalRest >= 10) cur++;
          else break; 
        }
        setStreak(cur);
      }

      setTaskStats({
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === "COMPLETED").length
      });
    } catch (e) {
      console.error("UI Update Error:", e);
    }
  }, []);

  useEffect(() => {
    updateLocalUI();

    SyncService.onSyncStatusChange((syncing) => {
      setIsSyncing(syncing);
      Animated.spring(slideAnim, {
        toValue: syncing ? 60 : -150,
        useNativeDriver: true,
        bounciness: 8
      }).start();
      
      if (!syncing) {
        updateLocalUI();
      }
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        SyncService.runSync();
      }
    });

    return () => unsubscribe();
  }, [updateLocalUI]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - LAST_FOCUS_TIME < 3000) return;
      LAST_FOCUS_TIME = now;
      updateLocalUI();
    }, [updateLocalUI])
  );

  const handleRefresh = async () => {
    if (isSyncing) return;
    setRefreshing(true);
    try {
      await SyncService.runSync();
      await refreshUser();
      await updateLocalUI();
      Vibration.vibrate(10);
    } catch (error) {
      console.error("Manual Sync Failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const seaService = getSeaServiceSummary(payload?.sections, payload?.shipType ?? undefined);
  const isOnboard = user?.status === 'Onboard';
  const isAssigned = !!user?.vesselId;

  return (
    <View style={{ flex: 1 }}>
      <KeelScreen>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.streakContainer}>
            <LinearGradient colors={['#10B981', '#059669']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.streakGradient}>
              <View style={styles.streakLeft}>
                <Activity color="#FFF" size={24} />
                <View style={{marginLeft: 12}}>
                  <Text style={styles.streakTitle}>Compliance Streak</Text>
                  <Text style={styles.streakSub}>Days since last STCW violation</Text>
                </View>
              </View>
              <View style={styles.streakRight}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakDays}>DAYS</Text>
              </View>
            </LinearGradient>
          </View>

          <Surface style={styles.heroWrapper} elevation={0}>
            <LinearGradient colors={['#3194A0', '#1A2426']} style={styles.heroGradient}>
              <View style={styles.heroTopRow}>
                <Avatar.Text size={55} label={user?.name?.substring(0, 2).toUpperCase() || "C"} style={styles.avatar} />
                <View style={styles.heroText}>
                  <Text style={styles.heroName}>{user?.name || "Cadet Name"}</Text>
                  <TouchableOpacity 
                    onPress={() => { Vibration.vibrate(10); setLogModalVisible(true); }} 
                    style={[styles.syncStatusTrigger, { backgroundColor: isSyncing ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0,0,0,0.2)' }]}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size={10} color="#4ADE80" style={{marginRight: 4}} />
                    ) : (
                      <Info size={12} color={pendingSyncCount > 0 ? "#F59E0B" : "#4ADE80"} />
                    )}
                    <Text style={[styles.syncStatusText, { color: pendingSyncCount > 0 && !isSyncing ? "#F59E0B" : "#4ADE80" }]}>
                      {isSyncing ? "Syncing..." : (pendingSyncCount > 0 ? `Resume Sync: ${pendingSyncCount}` : "Cloud: Synced")}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.syncBtn} onPress={handleRefresh} disabled={refreshing || isSyncing}>
                  {refreshing ? (
                    <ActivityIndicator size={20} color="#FFF" />
                  ) : (
                    <View>
                      <RefreshCcw size={20} color="#FFF" />
                      {pendingSyncCount > 0 && (
                        <View style={styles.syncBadge}>
                          <Text style={styles.syncBadgeText}>{pendingSyncCount}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <Divider style={styles.heroDivider} />
              <View style={styles.vesselRow}>
                <Ship size={18} color="rgba(255,255,255,0.6)" />
                <Text style={styles.vesselName}>{user?.vesselName ? user.vesselName.toUpperCase() : "NO VESSEL ASSIGNED"}</Text>
                <View style={[styles.statusPill, { backgroundColor: isOnboard ? '#4ADE80' : '#F59E0B' }]}>
                  <Text style={styles.statusPillText}>{user?.status ? user.status.toUpperCase() : "READY"}</Text>
                </View>
              </View>
            </LinearGradient>
          </Surface>

          <ComplianceTrend logs={logs} />
          <Text style={styles.sectionTitle}>Compliance & Readiness</Text>
          <ComplianceIndicatorCard title="Sea Service Profile" status={seaService.inProgressSections > 0 ? "ATTENTION" : "ON_TRACK"} summary={`${seaService.completedSections} of ${seaService.totalSections} sections finalized`} onPress={() => navigation.navigate("SeaService")} />
          <WatchkeepingCompliance />
          <ComplianceIndicatorCard title="Training Tasks (TRB)" status={taskStats.completed < taskStats.total ? "ATTENTION" : "ON_TRACK"} summary={`${taskStats.completed} completed • ${(taskStats.total || 0) - taskStats.completed} pending`} onPress={() => navigation.navigate("Tasks")} />

          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Operational Actions</Text>
            <View style={styles.actionGrid}>
              <ActionBtn title="Daily Log" icon={<Database size={20} color="#FFF" />} onPress={() => navigation.navigate("Daily")} />
            </View>
          </View>

          <MilestoneModal visible={celebrationVisible} onClose={() => setCelebrationVisible(false)} days={streak} />
          <View style={{ height: 40 }} />
        </ScrollView>

        <Animated.View style={[styles.hudContainer, { transform: [{ translateY: slideAnim }] }]}>
          <Surface style={styles.hudSurface} elevation={5}>
            <ActivityIndicator size={16} color="#3194A0" />
            <Text style={styles.hudText}>Satellite Sync Active...</Text>
          </Surface>
        </Animated.View>

        <Modal visible={logModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
            <Surface style={styles.logModalContent} elevation={5}>
              <View style={styles.logHeader}>
                 <CloudUpload color="#3194A0" size={24} />
                 <Text style={styles.logTitle}>Bandwidth-Saver Sync</Text>
              </View>
              <View style={{ marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>Total Remaining Data</Text>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#3194A0' }}>{`${pendingSyncCount} items`}</Text>
                  </View>
                  <ProgressBar progress={syncProgress} color="#3194A0" style={{ height: 8, borderRadius: 4 }} />
              </View>
              <Divider style={{marginVertical: 20}} />
              <SyncLogRow label="Daily Activity Logs" time={syncTimestamps.logs} />
              <SyncLogRow label="Task Attachments" time={syncTimestamps.attachments} />
              <SyncLogRow label="Shore Task Data" time={syncTimestamps.tasks} />
              <Button mode="contained" onPress={() => setLogModalVisible(false)} style={{marginTop: 25, borderRadius: 12}} buttonColor="#3194A0">
                Close Monitor
              </Button>
            </Surface>
          </View>
        </Modal>

        <JoinVesselModal 
          visible={joinModalVisible} 
          onClose={() => setJoinModalVisible(false)} 
          vesselName={user?.vesselName || ""} 
          onSuccess={() => { setJoinModalVisible(false); refreshUser(); }} 
        />
      </KeelScreen>
    </View>
  );
}

const SyncLogRow = ({ label, time }: any) => (
  <View style={styles.logRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.logLabel}>{label}</Text>
      <Text style={styles.logTime}>{`Last Synced: ${time}`}</Text>
    </View>
    <CheckCircle2 size={18} color={time === 'Never' || time === '-' ? '#94A3B8' : '#4ADE80'} />
  </View>
);

const KPICard = ({ icon, label, value }: any) => (
  <Card style={styles.kpiCard}>
    <Card.Content style={styles.kpiContent}>
      {icon}
      <View style={styles.kpiTextWrapper}>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
      </View>
    </Card.Content>
  </Card>
);

const ActionBtn = ({ title, icon, onPress, outlined }: any) => (
  <Button mode={outlined ? "outlined" : "contained"} onPress={onPress} style={[styles.actionBtn, outlined && { borderColor: '#3194A0' }]} contentStyle={{ height: 50 }} icon={() => icon} textColor={outlined ? '#3194A0' : '#FFF'}>{title}</Button>
);

const JoinVesselModal = ({ visible, onClose, vesselName, onSuccess }: any) => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");
  const [loading, setLoading] = useState(false);
  const handleJoin = async () => {
    if (!date) return alert("Please select a sign-on date.");
    setLoading(true);
    try {
      await api.post('/trainee-assignments/join', { sign_on_date: date.toISOString(), sign_on_port: port });
      onSuccess();
    } catch (e) { alert("Failed to join vessel."); } finally { setLoading(false); }
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <Surface style={styles.modalContent} elevation={4}>
          <Text style={styles.modalTitle}>{`Join ${vesselName}`}</Text>
          <View style={{ marginVertical: 16 }}><DateInputField label="Sign On Date" value={date} onChange={setDate} /></View>
          <TextInput label="Port of Embarkation" value={port} onChangeText={setPort} mode="outlined" style={{ marginBottom: 24, backgroundColor: '#FFF' }} outlineColor="#E5E7EB" activeOutlineColor="#3194A0" />
          <View style={styles.modalActions}><Button onPress={onClose} style={{flex:1}} textColor="#6B7280">Cancel</Button><Button mode="contained" onPress={handleJoin} loading={loading} style={{flex:1}} buttonColor="#3194A0">Confirm & Join</Button></View>
        </Surface>
      </View>
    </Modal>
  );
};

function WatchkeepingCompliance() {
  const navigation = useNavigation<any>();
  const { stcwComplianceStatus, loading, logs: ctxLogs } = useDailyLogs();
  if (loading) return null;
  return (
    <ComplianceIndicatorCard title="Watchkeeping (STCW)" status={ctxLogs.length === 0 ? "ATTENTION" : stcwComplianceStatus === "NON_COMPLIANT" ? "RISK" : "ON_TRACK"} summary={ctxLogs.length === 0 ? "No records found" : stcwComplianceStatus === "NON_COMPLIANT" ? "Rest violation detected" : "Requirements met"} onPress={() => navigation.navigate("Daily")} />
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 16 },
  streakContainer: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', elevation: 4 },
  streakGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  streakLeft: { flexDirection: 'row', alignItems: 'center' },
  streakTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  streakSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  streakRight: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  streakNumber: { color: '#FFF', fontSize: 22, fontWeight: '900', lineHeight: 24 },
  streakDays: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  heroWrapper: { borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  heroGradient: { padding: 20 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroText: { marginLeft: 16, flex: 1 },
  heroName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgeText: { color: '#4ADE80', fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
  syncBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14 },
  syncBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3194A0',
  },
  syncBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },
  heroDivider: { backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  vesselRow: { flexDirection: 'row', alignItems: 'center' },
  vesselName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginLeft: 10, letterSpacing: 0.5, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  statusPillText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  alertCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  alertGradient: { padding: 16 },
  alertTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  alertSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpiCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3194A0' },
  kpiContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  kpiTextWrapper: { marginLeft: 12 },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#1A2426' },
  kpiLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#3194A0', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  actionSection: { marginTop: 12 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },
  hudContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, alignItems: 'center' },
  hudSurface: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, gap: 12 },
  hudText: { fontSize: 12, fontWeight: '700', color: '#1A2426' },
  syncStatusTrigger: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  syncStatusText: { fontSize: 10, fontWeight: '700' },
  logModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 25 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logTitle: { fontSize: 18, fontWeight: '900', color: '#1A2426' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  logTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
});