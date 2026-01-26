//keel-mobile/src/screens/main/HomeScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
  Surface,
  Avatar,
  TextInput,
  ActivityIndicator
} from "react-native-paper";
import { 
  Ship, Anchor, Activity, Clock,  
  RefreshCcw, Database
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';

// ✅ FIXED: All paths updated to ../../ for components/services
import { KeelScreen } from "../../components/ui/KeelScreen";
import { useSeaService } from "../../sea-service/SeaServiceContext";
import { getSeaServiceSummary } from "../../sea-service/seaServiceStatus";
import { useDailyLogs } from "../../daily-logs/DailyLogsContext";
import { useNavigation } from "@react-navigation/native";
import { ensureSeedTasksExist, getAllTaskRecords } from "../../db/tasks";
import { useAuth } from "../../auth/AuthContext";
import ComplianceIndicatorCard from "../../components/home/ComplianceIndicatorCard";
import api from "../../services/api";
import DateInputField from "../../components/inputs/DateInputField"; 

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user, updateUser, refreshUser } = useAuth();
  const { payload } = useSeaService();
  const { stcwComplianceStatus, logs } = useDailyLogs();

  // Task Statistics
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    ensureSeedTasksExist();
    const allTasks = getAllTaskRecords();
    setTaskStats({
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === "COMPLETED").length
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const seaService = getSeaServiceSummary(payload?.sections, payload?.shipType ?? undefined);

  // Status Logic
  const isOnboard = user?.status === 'Onboard';
  const isAssigned = !!user?.vesselId;

  return (
    <KeelScreen>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1) MARITIME HERO */}
        <Surface style={styles.heroWrapper} elevation={0}>
          <LinearGradient colors={['#3194A0', '#1A2426']} style={styles.heroGradient}>
            <View style={styles.heroTopRow}>
              <Avatar.Text 
                size={55} 
                label={user?.name?.substring(0, 2).toUpperCase() || "C"} 
                style={styles.avatar} 
              />
              <View style={styles.heroText}>
                <Text style={styles.heroName}>{user?.name || "Cadet Name"}</Text>
                <View style={styles.heroBadge}>
                  <Anchor size={12} color="#4ADE80" />
                  <Text style={styles.badgeText}>{user?.rank?.toUpperCase() || "DECK CADET"}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.syncBtn} onPress={handleRefresh} disabled={refreshing}>
                {refreshing ? <ActivityIndicator size={20} color="#FFF" /> : <RefreshCcw size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>
            
            <Divider style={styles.heroDivider} />
            
            {/* DYNAMIC VESSEL ROW */}
            <View style={styles.vesselRow}>
              <Ship size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.vesselName}>
                {user?.vesselName ? `${user.vesselName.toUpperCase()}` : "NO VESSEL ASSIGNED"}
              </Text>
              
              {/* Show Status Pill next to vessel */}
              <View style={[styles.statusPill, { backgroundColor: isOnboard ? '#4ADE80' : '#F59E0B' }]}>
                <Text style={styles.statusPillText}>{user?.status?.toUpperCase() || "READY"}</Text>
              </View>
            </View>
          </LinearGradient>
        </Surface>

        {/* 2) ACTIONS & ALERTS */}
        
        {/* CASE: ASSIGNED BUT NOT JOINED -> SHOW JOIN ACTION */}
        {isAssigned && !isOnboard && (
          <Surface style={styles.alertCard} elevation={2}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.alertGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View>
                  <Text style={styles.alertTitle}>Ready to Join?</Text>
                  <Text style={styles.alertSub}>You are assigned to {user?.vesselName}.</Text>
                  <Text style={styles.alertSub}>Tap to confirm joining details.</Text>
                </View>
                <Button mode="contained" buttonColor="#FFF" textColor="#D97706" onPress={() => setJoinModalVisible(true)}>
                  JOIN SHIP
                </Button>
              </View>
            </LinearGradient>
          </Surface>
        )}

        {/* CASE: NOT ONBOARD -> SHOW STATUS TOGGLE (READY / LEAVE) */}
        {!isOnboard && (
          <View style={styles.statusToggleContainer}>
             <Text style={styles.sectionTitle}>CURRENT STATUS</Text>
             <View style={styles.statusToggleRow}>
                <StatusOption 
                  label="Ready to Join" 
                  active={user?.status === 'Ready'} 
                  color="#3194A0" 
                  onPress={() => updateUser({ status: 'Ready' })}
                />
                <StatusOption 
                  label="On Leave" 
                  active={user?.status === 'Leave'} 
                  color="#EF4444" 
                  onPress={() => updateUser({ status: 'Leave' })}
                />
             </View>
          </View>
        )}

        {/* 3) TECHNICAL KPI GRID */}
        <View style={styles.kpiGrid}>
          <KPICard 
            icon={<Activity size={20} color="#3194A0" />} 
            label="TRB Progress" 
            value={`${Math.round((taskStats.completed / (taskStats.total || 1)) * 100)}%`} 
          />
          <KPICard 
            icon={<Clock size={20} color="#F59E0B" />} 
            label="Sea Days" 
            value="142 / 365" 
          />
        </View>

        {/* 4) COMPLIANCE */}
        <Text style={styles.sectionTitle}>Compliance & Readiness</Text>

        <ComplianceIndicatorCard
          title="Sea Service Profile"
          status={seaService.inProgressSections > 0 ? "ATTENTION" : "ON_TRACK"}
          summary={`${seaService.completedSections} of ${seaService.totalSections} sections finalized`}
          onPress={() => navigation.navigate("SeaServiceWizard")}
        />

        <WatchkeepingCompliance />

        <ComplianceIndicatorCard
          title="Training Tasks (TRB)"
          status={taskStats.completed < taskStats.total ? "ATTENTION" : "ON_TRACK"}
          summary={`${taskStats.completed} completed • ${(taskStats.total || 0) - taskStats.completed} pending`}
          onPress={() => navigation.navigate("Tasks")}
        />

        {/* 5) QUICK ACTIONS */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Operational Actions</Text>
          <View style={styles.actionGrid}>
            <ActionBtn 
              title="Daily Log" 
              icon={<Database size={20} color="#FFF" />} 
              onPress={() => navigation.navigate("Daily")}
            />
            <ActionBtn 
              title="Vessel Info" 
              icon={<Ship size={20} color="#FFF" />} 
              onPress={() => navigation.navigate("VesselParticulars")}
              outlined
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* JOIN VESSEL MODAL */}
      <JoinVesselModal 
        visible={joinModalVisible} 
        onClose={() => setJoinModalVisible(false)} 
        vesselName={user?.vesselName || ""}
        onSuccess={() => {
          setJoinModalVisible(false);
          refreshUser();
        }}
      />
    </KeelScreen>
  );
}

const StatusOption = ({ label, active, color, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.statusOption, active && { backgroundColor: color, borderColor: color }]}>
    <Text style={[styles.statusOptionText, active && { color: '#FFF' }]}>{label}</Text>
  </TouchableOpacity>
);

const JoinVesselModal = ({ visible, onClose, vesselName, onSuccess }: any) => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!date) {
        alert("Please select a sign-on date.");
        return;
    }
    
    setLoading(true);
    try {
      await api.post('/trainee-assignments/join', {
        sign_on_date: date.toISOString(),
        sign_on_port: port
      });
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Failed to join vessel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <Surface style={styles.modalContent} elevation={4}>
          <Text style={styles.modalTitle}>Join {vesselName}</Text>
          <Text style={styles.modalSub}>Please confirm your sign-on details.</Text>
          
          <View style={{ marginVertical: 16 }}>
             <DateInputField label="Sign On Date" value={date} onChange={setDate} />
          </View>
          
          <TextInput 
            label="Port of Embarkation" 
            value={port} 
            onChangeText={setPort} 
            mode="outlined" 
            style={{ marginBottom: 24, backgroundColor: '#FFF' }}
            outlineColor="#E5E7EB"
            activeOutlineColor="#3194A0"
          />

          <View style={styles.modalActions}>
             <Button onPress={onClose} style={{flex:1}} textColor="#6B7280">Cancel</Button>
             <Button mode="contained" onPress={handleJoin} loading={loading} style={{flex:1}} buttonColor="#3194A0">
                Confirm & Join
             </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
};

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
  <Button 
    mode={outlined ? "outlined" : "contained"} 
    onPress={onPress} 
    style={[styles.actionBtn, outlined && { borderColor: '#3194A0' }]}
    contentStyle={{ height: 50 }}
    icon={() => icon}
    textColor={outlined ? '#3194A0' : '#FFF'}
  >
    {title}
  </Button>
);

function WatchkeepingCompliance() {
  const navigation = useNavigation<any>();
  const { stcwComplianceStatus, loading, logs } = useDailyLogs();
  if (loading) return null;
  return (
    <ComplianceIndicatorCard
      title="Watchkeeping (STCW)"
      status={logs.length === 0 ? "ATTENTION" : stcwComplianceStatus === "NON_COMPLIANT" ? "RISK" : "ON_TRACK"}
      summary={logs.length === 0 ? "No records found" : stcwComplianceStatus === "NON_COMPLIANT" ? "Rest violation detected" : "Requirements met"}
      onPress={() => navigation.navigate("Daily")}
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 16 },
  heroWrapper: { borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  heroGradient: { padding: 20 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroText: { marginLeft: 16, flex: 1 },
  heroName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgeText: { color: '#4ADE80', fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
  syncBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14 },
  heroDivider: { backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  vesselRow: { flexDirection: 'row', alignItems: 'center' },
  vesselName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginLeft: 10, letterSpacing: 0.5, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  statusPillText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  
  alertCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  alertGradient: { padding: 16 },
  alertTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  alertSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  statusToggleContainer: { marginBottom: 20 },
  statusToggleRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statusOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  statusOptionText: { fontWeight: '700', fontSize: 13, color: '#6B7280' },

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
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 }
});