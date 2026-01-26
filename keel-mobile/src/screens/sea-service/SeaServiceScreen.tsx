//keel-mobile/src/screens/sea-service/SeaServiceScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Modal } from "react-native";
import {
  Text,
  useTheme,
  Surface,
  SegmentedButtons,
  TouchableRipple,
  Button,
  TextInput,
  Card,
  Chip,
  Divider,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import {
  Cog, Zap, Utensils, Anchor, ShieldAlert, ArrowRight, Lock, 
  CheckCircle2, Maximize, LogOut, MapPin, Ship, History
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { BlurView } from 'expo-blur'; // Ensure you have this or use a View with opacity

// Contexts
import { useAuth } from "../../auth/AuthContext";
import { useSeaService } from "../../sea-service/SeaServiceContext";
import DateInputField from "../../components/inputs/DateInputField";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function SeaServiceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  const { user } = useAuth();
  const { 
    seaServiceId, 
    payload, 
    finalHistory,
    updateServicePeriod, 
    finalizeSeaService,
    startSeaServiceDraft // NEW: We call this directly now
  } = useSeaService();

  // --- START VOYAGE STATE (ASHORE) ---
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [startData, setStartData] = useState({ date: new Date(), port: '' });
  const [isStarting, setIsStarting] = useState(false);

  // --- ONBOARD STATE ---
  const [workflowStep, setWorkflowStep] = useState(1); 
  const [dept, setDept] = useState("deck");
  const [isLocked, setIsLocked] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [signOffData, setSignOffData] = useState({ date: new Date(), port: '' });

  // Specs State
  const [genSpecs, setGenSpecs] = useState({ loa: "", breadth: "", summerDraft: "", callSign: "" });
  const [deckSpecs, setDeckSpecs] = useState({ holds: "", cranes: "", swl: "", bwms: "" });

  const handleStartVoyage = async () => {
    if (!startData.date || !startData.port.trim()) return;
    setIsStarting(true);
    try {
      // Create Draft
      await startSeaServiceDraft({
        shipType: "General Cargo", // Default, sync later
        signOnDate: startData.date.toISOString().slice(0, 10),
        signOnPort: startData.port.trim()
      });
      setStartModalVisible(false);
      // UI Auto-updates because 'seaServiceId' is no longer null
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to start voyage' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinalLock = () => {
    Alert.alert(
      "Verify Technical Data",
      "Confirm all particulars are correct? This will LOCK the data and ENABLE the Sign-Off section.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Verify & Lock", onPress: () => {
            setIsLocked(true);
            setWorkflowStep(3);
            Toast.show({ type: 'success', text1: 'Verified', text2: 'Sign-Off enabled.' });
        }}
      ]
    );
  };

  const handleSignOff = async () => {
    Alert.alert(
      "Confirm Sign-Off",
      "This will FINALIZE your record. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Finalize", 
          style: "destructive",
          onPress: async () => {
            setIsFinalizing(true);
            try {
              updateServicePeriod({
                ...payload.servicePeriod,
                signOffDate: signOffData.date,
                signOffPort: signOffData.port
              });
              await new Promise(r => setTimeout(r, 100));
              await finalizeSeaService();
              Toast.show({ type: "success", text1: "Voyage Completed" });
            } catch (e) {
              Toast.show({ type: "error", text1: "Error", text2: "Failed to finalize." });
            } finally {
              setIsFinalizing(false);
            }
          }
        }
      ]
    );
  };

  const displayVesselName = user?.vesselName || "Assigned Vessel";
  const displaySignOnDate = payload?.servicePeriod?.signOnDate 
    ? new Date(payload.servicePeriod.signOnDate).toLocaleDateString() 
    : "Date Not Set";
  const displayPort = payload?.servicePeriod?.signOnPort || "Port Not Set";

  // ------------------------------------------------------------
  // MODE 1: ASHORE (HISTORY VIEW)
  // ------------------------------------------------------------
  if (!seaServiceId) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.ashoreHeader}>
          <Text style={styles.ashoreTitle}>Sea Service</Text>
          <Text style={styles.ashoreSubtitle}>You are currently signed off.</Text>
        </View>

        <Surface style={styles.startCard} elevation={2}>
          <LinearGradient colors={["#3194A0", "#1A2426"]} style={styles.startGradient}>
            <Ship size={32} color="rgba(255,255,255,0.8)" />
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Start New Voyage</Text>
              <Text style={styles.startSub}>Assigned to {user?.vesselName || "Vessel"}?</Text>
            </View>
            <Button 
              mode="contained" 
              buttonColor="#FFF" 
              textColor="#3194A0"
              onPress={() => setStartModalVisible(true)}
            >
              Start
            </Button>
          </LinearGradient>
        </Surface>

        <View style={styles.historySection}>
          <View style={styles.historyLabelRow}>
            <History size={16} color={theme.colors.outline} />
            <Text style={styles.historyLabel}>SERVICE HISTORY</Text>
          </View>
          {finalHistory.length === 0 ? (
            <Text style={styles.emptyHistory}>No completed records found.</Text>
          ) : (
            finalHistory.map((rec) => (
              <Card key={rec.id} style={styles.historyCard}>
                <Card.Content>
                  <View style={styles.historyRow}>
                    <View>
                      <Text variant="titleMedium" style={{ fontWeight: '700' }}>{rec.shipName || "Unknown"}</Text>
                      <Text variant="bodySmall" style={{ opacity: 0.6 }}>{rec.imoNumber ? `IMO: ${rec.imoNumber}` : ""}</Text>
                    </View>
                    <Chip compact style={{ backgroundColor: "#E0E0E0" }}>Finalized</Chip>
                  </View>
                  <Divider style={{ marginVertical: 10 }} />
                  <View style={styles.historyDates}>
                    <Text variant="bodySmall">On: {formatDate(rec.signOnDate)}</Text>
                    <Text variant="bodySmall">Off: {formatDate(rec.signOffDate)}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* START MODAL */}
        <Modal visible={startModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <Surface style={styles.modalContent}>
              <Text style={styles.modalTitle}>Join {user?.vesselName || "Vessel"}</Text>
              <View style={{ marginVertical: 16 }}>
                <DateInputField label="Sign On Date" value={startData.date} onChange={(d) => setStartData({...startData, date: d!})} />
              </View>
              <TextInput 
                label="Port of Embarkation" 
                value={startData.port} 
                onChangeText={(t) => setStartData({...startData, port: t})} 
                mode="outlined"
                style={{ backgroundColor: '#FFF', marginBottom: 20 }}
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setStartModalVisible(false)} style={{flex:1}}>Cancel</Button>
                <Button mode="contained" onPress={handleStartVoyage} loading={isStarting} style={{flex:1}} buttonColor="#3194A0">Confirm</Button>
              </View>
            </Surface>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // ------------------------------------------------------------
  // MODE 2: ONBOARD (DASHBOARD)
  // ------------------------------------------------------------
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* HERO */}
      <View style={styles.sectionWrapper}>
        <LinearGradient colors={["#2C3E50", "#1A1A1A"]} style={styles.heroGradient}>
          <View style={styles.headerTopRow}>
            <Text style={styles.stepTag}>ACTIVE VOYAGE</Text>
            <CheckCircle2 size={20} color="#4ADE80" />
          </View>
          <Text style={styles.heroTitle}>{displayVesselName}</Text>
          <View style={styles.confirmedBox}>
            <Text style={styles.confirmedText}>Rank: {user?.rank || "Cadet"}</Text>
            <Text style={styles.confirmedText}>Joined: {displaySignOnDate} at {displayPort}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* STEP 1: SAFETY */}
      <View style={[styles.sectionWrapper, workflowStep < 1 && styles.lockedOpacity]}>
        <Surface style={styles.glassCard} elevation={workflowStep === 1 ? 4 : 0}>
          <TouchableRipple onPress={() => workflowStep === 1 && navigation.navigate('SafetyMap')} style={styles.ripple} disabled={workflowStep !== 1}>
            <View style={styles.safetyContent}>
              <View style={styles.iconCircle}><ShieldAlert color={workflowStep === 1 ? theme.colors.error : theme.colors.outline} size={24} /></View>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.stepTagAlt}>STEP 01</Text>
                <Text style={styles.cardMainLabel}>Safety Familiarization</Text>
                <Text style={styles.subtext}>Mandatory Walkthrough</Text>
              </View>
              {workflowStep < 1 ? <Lock size={20} color={theme.colors.outline} /> : <ArrowRight size={20} color={theme.colors.primary} />}
            </View>
          </TouchableRipple>
          {workflowStep === 1 && <Button mode="text" onPress={() => setWorkflowStep(2)} textColor={theme.colors.primary}>Simulate Completion</Button>}
        </Surface>
      </View>

      {/* STEP 2: TECH DATA */}
      <View style={[styles.sectionWrapper, workflowStep < 2 && styles.lockedOpacity]}>
        <Text style={styles.technicalHeader}>STEP 02: TECHNICAL DATA</Text>
        <SegmentedButtons
          value={dept} onValueChange={setDept} style={styles.segment}
          buttons={[
            { value: 'deck', label: 'DECK', disabled: workflowStep < 2, icon: () => <Anchor size={16} color={dept==='deck'?'#FFF':theme.colors.primary}/> },
            { value: 'engine', label: 'ENG', disabled: workflowStep < 2, icon: () => <Cog size={16} color={dept==='engine'?'#FFF':theme.colors.primary}/> },
          ]}
        />
        {workflowStep >= 2 ? (
          <View style={styles.specsContainer}>
            <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Maximize size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Principal Dimensions</Text></View>
                <View style={styles.inputRow}>
                    <TextInput label="LOA (m)" value={genSpecs.loa} onChangeText={(v)=>setGenSpecs({...genSpecs, loa: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="BREADTH (m)" value={genSpecs.breadth} onChangeText={(v)=>setGenSpecs({...genSpecs, breadth: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
            </Surface>
            <Button mode="contained" onPress={handleFinalLock} disabled={isLocked} style={[styles.verifyBtn, isLocked && { backgroundColor: theme.colors.secondary }]} icon={isLocked ? "lock" : "check-circle"}>
              {isLocked ? "DATA LOCKED" : "VERIFY DATA"}
            </Button>
          </View>
        ) : (
          <LinearGradient colors={theme.dark ? ["#1F1F1F", "#121212"] : ["#F9FAFB", "#F3F4F6"]} style={styles.lockedCard}>
            <View style={styles.lockedIconCircle}><Lock size={32} color="#3194A0" /></View>
            <Text style={styles.lockedTitle}>RESTRICTED ACCESS</Text>
            <Text style={styles.lockedMsg}>Complete Safety Familiarization first.</Text>
          </LinearGradient>
        )}
      </View>

      {/* STEP 3: SIGN OFF */}
      <View style={[styles.sectionWrapper, workflowStep < 3 && styles.lockedOpacity]}>
        <Text style={[styles.technicalHeader, { color: theme.colors.error }]}>STEP 03: VOYAGE COMPLETION</Text>
        
        {isLocked ? (
            <Surface style={[styles.technicalCard, { borderColor: theme.colors.error, borderWidth: 1 }]}>
                <View style={styles.rowHeader}>
                    <LogOut size={20} color={theme.colors.error} />
                    <Text style={[styles.specHeader, { color: theme.colors.error }]}>Sign-Off</Text>
                </View>
                <DateInputField label="Sign-Off Date" value={signOffData.date} onChange={(d)=>setSignOffData({...signOffData, date: d!})} />
                <View style={{ height: 12 }} />
                <TextInput label="Sign-Off Port" value={signOffData.port} onChangeText={(t)=>setSignOffData({...signOffData, port: t})} mode="outlined" right={<TextInput.Icon icon={() => <MapPin size={20} color={theme.colors.outline}/>} />} />
                <Button mode="contained" onPress={handleSignOff} loading={isFinalizing} buttonColor={theme.colors.error} style={{ marginTop: 20, borderRadius: 12 }}>FINALIZE VOYAGE</Button>
            </Surface>
        ) : (
            <LinearGradient colors={theme.dark ? ["#1F1F1F", "#121212"] : ["#F9FAFB", "#F3F4F6"]} style={styles.lockedCard}>
              <View style={styles.lockedIconCircle}><Lock size={32} color="#3194A0" /></View>
              <Text style={styles.lockedTitle}>RESTRICTED ACCESS</Text>
              <Text style={styles.lockedMsg}>Verify Technical Data to enable Sign-Off.</Text>
            </LinearGradient>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Ashore Styles
  ashoreHeader: { marginTop: 20, marginBottom: 20 },
  ashoreTitle: { fontSize: 32, fontWeight: '800' },
  ashoreSubtitle: { fontSize: 16, opacity: 0.6 },
  startCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 30 },
  startGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  startTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  startSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  historySection: { flex: 1 },
  historyLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  historyLabel: { fontSize: 12, fontWeight: '900', color: 'gray', letterSpacing: 1 },
  emptyHistory: { textAlign: 'center', marginTop: 40, opacity: 0.5 },
  historyCard: { marginBottom: 12, backgroundColor: '#FFF' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyDates: { flexDirection: 'row', justifyContent: 'space-between', opacity: 0.7 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },

  // Onboard Styles
  sectionWrapper: { paddingHorizontal: 16, marginTop: 16 },
  heroGradient: { borderRadius: 24, padding: 24, minHeight: 140 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  stepTag: { color: "rgba(255,255,255,0.6)", letterSpacing: 2, fontSize: 10, fontWeight: "900" },
  heroTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginBottom: 8 },
  confirmedBox: { marginTop: 4 },
  confirmedText: { color: "#4ADE80", fontWeight: "700", fontSize: 13, marginBottom: 2 },
  lockedOpacity: { opacity: 0.5 },
  glassCard: { borderRadius: 24, overflow: "hidden", backgroundColor: "#FFF" },
  ripple: { padding: 20 },
  safetyContent: { flexDirection: "row", alignItems: "center" },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.03)", justifyContent: "center", alignItems: "center" },
  stepTagAlt: { fontSize: 10, fontWeight: "900", opacity: 0.4, letterSpacing: 1 },
  cardMainLabel: { fontSize: 16, fontWeight: "800" },
  subtext: { fontSize: 12, opacity: 0.5 },
  technicalHeader: { fontSize: 12, fontWeight: "900", color: "rgba(128,128,128,0.6)", letterSpacing: 1.5, marginBottom: 12 },
  segment: { marginBottom: 15 },
  specsContainer: { marginTop: 10 },
  technicalCard: { borderRadius: 24, padding: 20, marginBottom: 15, backgroundColor: "#FFF" },
  rowHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  specHeader: { fontWeight: "900", fontSize: 13, color: "#3194A0", marginLeft: 10, textTransform: "uppercase" },
  innerInput: { marginBottom: 10, fontSize: 13, backgroundColor: "transparent" },
  inputRow: { flexDirection: "row", marginBottom: 5 },
  verifyBtn: { borderRadius: 16, height: 50, justifyContent: "center", marginTop: 10 },
  lockedCard: { borderRadius: 24, padding: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(128,128,128, 0.1)", overflow: 'hidden' },
  lockedIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(49, 148, 160, 0.08)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  lockedTitle: { fontSize: 14, fontWeight: "800", color: "#3194A0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  lockedMsg: { fontSize: 14, color: "rgba(128,128,128, 0.7)", textAlign: "center", maxWidth: '85%', lineHeight: 22, fontWeight: "500" },
});