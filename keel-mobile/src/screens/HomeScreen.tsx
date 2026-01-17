// keel-mobile/src/screens/HomeScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
  Surface,
  Avatar,
} from "react-native-paper";
import { 
  Ship, Anchor, Activity, Clock, ShieldCheck, 
  AlertCircle, ChevronRight, Database, RefreshCcw 
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { KeelScreen } from "../components/ui/KeelScreen";
import { useSeaService } from "../sea-service/SeaServiceContext";
import { getSeaServiceSummary } from "../sea-service/seaServiceStatus";
import { useDailyLogs } from "../daily-logs/DailyLogsContext";
import { useNavigation } from "@react-navigation/native";
import { ensureSeedTasksExist, getAllTaskRecords } from "../db/tasks";
import { useAuth } from "../auth/AuthContext";
import ComplianceIndicatorCard from "../components/home/ComplianceIndicatorCard";

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { payload } = useSeaService();
  const { stcwComplianceStatus, logs } = useDailyLogs();

  // Task Statistics from SQLite
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    ensureSeedTasksExist();
    const allTasks = getAllTaskRecords();
    setTaskStats({
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === "COMPLETED").length
    });
  }, []);

  const seaService = getSeaServiceSummary(payload?.sections, payload?.shipType ?? undefined);

  return (
    <KeelScreen>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1) MARITIME HERO — Unified Identity */}
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
                  <Text style={styles.badgeText}>{user?.category?.toUpperCase() || "DECK CADET"}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.syncBtn}>
                <RefreshCcw size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <Divider style={styles.heroDivider} />
            
            <View style={styles.vesselRow}>
              <Ship size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.vesselName}>MV STARLIGHT • OIL TANKER</Text>
            </View>
          </LinearGradient>
        </Surface>

        {/* 2) TECHNICAL KPI GRID — Fleet Metrics */}
        <View style={styles.kpiGrid}>
          <KPICard 
            icon={<Activity size={20} color="#3194A0" />} 
            label="TRB Progress" 
            value={`${Math.round((taskStats.completed / taskStats.total) * 100 || 0)}%`} 
          />
          <KPICard 
            icon={<Clock size={20} color="#F59E0B" />} 
            label="Sea Days" 
            value="142 / 365" 
          />
        </View>

        {/* 3) COMPLIANCE READINESS — Actionable Matrix */}
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
          summary={`${taskStats.completed} completed • ${taskStats.total - taskStats.completed} pending`}
          onPress={() => navigation.navigate("Tasks")}
        />

        {/* 4) QUICK ACTIONS — Primary Workflow */}
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
    </KeelScreen>
  );
}

/**
 * HELPER: KPI Card Component
 */
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

/**
 * HELPER: Operational Action Button
 */
const ActionBtn = ({ title, icon, onPress, outlined }: any) => (
  <Button 
    mode={outlined ? "outlined" : "contained"} 
    onPress={onPress} 
    style={[styles.actionBtn, outlined && { borderColor: '#3194A0' }]}
    contentStyle={{ height: 50 }}
    icon={() => icon}
  >
    {title}
  </Button>
);

/**
 * COMPONENT: Watchkeeping Compliance
 */
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
  vesselName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginLeft: 10, letterSpacing: 0.5 },
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
});