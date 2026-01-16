//keel-mobile/src/screens/VesselParticularsScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from "react-native";
import {
  Text,
  useTheme,
  Surface,
  SegmentedButtons,
  TouchableRipple,
  Button,
  TextInput,
  Divider,
  Menu,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import {
  Ship,
  Cog,
  Zap,
  Utensils,
  Anchor,
  ShieldAlert,
  ArrowRight,
  Lock,
  CheckCircle2,
  ClipboardList,
  Maximize,
  Scale,
  Activity,
  Wind,
  Droplets,
  HardHat,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateInputField from "../components/inputs/DateInputField";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export const VesselParticularsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const [workflowStep, setWorkflowStep] = useState(1);
  const [dept, setDept] = useState("deck");
  const [signOnDate, setSignOnDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // --- STATE MANAGEMENT FOR ALL DEPARTMENTS ---
  const [genSpecs, setGenSpecs] = useState({
    vesselName: "", imo: "", callSign: "", flag: "", loa: "", breadth: "", summerDraft: ""
  });

  const [deckSpecs, setDeckSpecs] = useState({
    holds: "", hatchType: "", cranes: "", swl: "", anchorShackles: "", bwms: ""
  });

  const [engineSpecs, setEngineSpecs] = useState({
    meMake: "", meMcr: "", sfoc: "", auxSets: "", boilerType: "", purifierCap: ""
  });

  const [etoSpecs, setEtoSpecs] = useState({
    voltage: "", frequency: "", msbMake: "", thrusterKw: "", batteryV: "", upsUnits: ""
  });

  const [cateringSpecs, setCateringSpecs] = useState({
    meatRoomVol: "", vegRoomVol: "", stoveType: "", stpMake: "", incinerator: "", berths: ""
  });

  const updateSpec = (key: string, val: string) => {
    if (workflowStep > 1) return;
    setGenSpecs({ ...genSpecs, [key]: val });
  };

  const handleSignOn = () => {
    if (!port || !genSpecs.vesselName || !genSpecs.imo) {
      Toast.show({
        type: "error",
        text1: "Information Incomplete",
        text2: "Vessel Name, IMO, and Port are mandatory to Sign-On.",
      });
      return;
    }
    setWorkflowStep(2);
    Toast.show({
      type: "success",
      text1: "Sign-On Complete",
      text2: "Proceed to Safety Familiarization.",
    });
  };

  const handleFinalLock = () => {
    Alert.alert(
      "Final Verification",
      "Confirm all technical particulars are correct? This will lock the Vessel Profile for this voyage.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Verify & Lock", onPress: () => {
            setIsLocked(true);
            Toast.show({ type: 'success', text1: 'Vessel Profile Locked', text2: 'Records verified by CTO.' });
        }}
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* 1. STEP 01: SIGN ON & GENERAL IDENTITY */}
      <View style={styles.sectionWrapper}>
        <LinearGradient
          colors={workflowStep === 1 ? [theme.colors.primary, "#1A2426"] : ["#2C3E50", "#1A1A1A"]}
          style={styles.heroGradient}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.stepTag}>STEP 01: GENERAL IDENTITY</Text>
            {workflowStep > 1 && <CheckCircle2 size={20} color="#4ADE80" />}
          </View>
          <Text style={styles.heroTitle}>{workflowStep === 1 ? "Vessel Sign-On" : genSpecs.vesselName || "Vessel Signed-On"}</Text>
          
          <View style={styles.formInside}>
            {workflowStep === 1 ? (
              <>
                <View style={styles.inputRow}>
                   <View style={{flex: 1, marginRight: 8}}><DateInputField label="Joining Date" value={signOnDate} onChange={setSignOnDate} required /></View>
                   <TextInput mode="flat" placeholder="Port of Joining" value={port} onChangeText={setPort} textColor="#FFF" placeholderTextColor="rgba(255,255,255,0.4)" style={[styles.flatInput, {flex: 1}]} />
                </View>
                <TextInput mode="flat" placeholder="Full Vessel Name" value={genSpecs.vesselName} onChangeText={(v) => updateSpec('vesselName', v)} textColor="#FFF" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.flatInput} />
                <View style={styles.inputRow}>
                  <TextInput mode="flat" placeholder="IMO Number" value={genSpecs.imo} onChangeText={(v) => updateSpec('imo', v)} keyboardType="numeric" textColor="#FFF" placeholderTextColor="rgba(255,255,255,0.4)" style={[styles.flatInput, {flex: 1, marginRight: 8}]} />
                  <TextInput mode="flat" placeholder="Call Sign" value={genSpecs.callSign} onChangeText={(v) => updateSpec('callSign', v)} textColor="#FFF" placeholderTextColor="rgba(255,255,255,0.4)" style={[styles.flatInput, {flex: 1}]} />
                </View>
                <Button mode="contained" onPress={handleSignOn} style={styles.onboardBtn} buttonColor="#FFF" textColor={theme.colors.primary}>Confirm Identity & Sign-On</Button>
              </>
            ) : (
              <View style={styles.confirmedBox}>
                <Text style={styles.confirmedText}>IMO: {genSpecs.imo} | Call Sign: {genSpecs.callSign}</Text>
                <Text style={styles.confirmedText}>Port: {port.toUpperCase()}</Text>
                <Text style={styles.confirmedText}>Joined: {signOnDate?.toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* 2. STEP 02: SAFETY FAMILIARIZATION */}
      <View style={[styles.sectionWrapper, workflowStep < 2 && styles.lockedOpacity]}>
        <Surface style={styles.glassCard} elevation={workflowStep === 2 ? 4 : 0}>
          <TouchableRipple onPress={() => workflowStep === 2 && navigation.navigate('SafetyMap')} style={styles.ripple} disabled={workflowStep !== 2}>
            <View style={styles.safetyContent}>
              <View style={styles.iconCircle}><ShieldAlert color={workflowStep === 2 ? theme.colors.error : theme.colors.outline} size={24} /></View>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.stepTagAlt}>STEP 02</Text>
                <Text style={styles.cardMainLabel}>Safety Familiarization</Text>
                <Text style={styles.subtext}>Mandatory Physical Walkthrough</Text>
              </View>
              {workflowStep < 2 ? <Lock size={20} color={theme.colors.outline} /> : <ArrowRight size={20} color={theme.colors.primary} />}
            </View>
          </TouchableRipple>
          {workflowStep === 2 && <Button mode="text" onPress={() => setWorkflowStep(3)} textColor={theme.colors.primary}>Simulate Completion</Button>}
        </Surface>
      </View>

      {/* 3. STEP 03: DEPARTMENT SPECIFICATIONS */}
      <View style={[styles.sectionWrapper, workflowStep < 3 && styles.lockedOpacity]}>
        <Text style={styles.technicalHeader}>STEP 03: TECHNICAL DATA</Text>
        <SegmentedButtons
          value={dept}
          onValueChange={setDept}
          style={styles.segment}
          buttons={[
            { value: 'deck', label: 'DECK', disabled: workflowStep < 3, icon: () => <Anchor size={16} color={dept === 'deck' ? '#FFF' : theme.colors.primary} /> },
            { value: 'engine', label: 'ENGINE', disabled: workflowStep < 3, icon: () => <Cog size={16} color={dept === 'engine' ? '#FFF' : theme.colors.primary} /> },
            { value: 'eto', label: 'ETO', disabled: workflowStep < 3, icon: () => <Zap size={16} color={dept === 'eto' ? '#FFF' : theme.colors.primary} /> },
            { value: 'catering', label: 'CAT', disabled: workflowStep < 3, icon: () => <Utensils size={16} color={dept === 'catering' ? '#FFF' : theme.colors.primary} /> },
          ]}
        />

        {workflowStep === 3 ? (
          <View style={styles.specsContainer}>
            {/* Dimensions Section (Common to all) */}
            <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Maximize size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Principal Dimensions</Text></View>
                <View style={styles.inputRow}>
                    <TextInput label="LOA (m)" value={genSpecs.loa} onChangeText={(v)=>updateSpec('loa',v)} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="BREADTH (m)" value={genSpecs.breadth} onChangeText={(v)=>updateSpec('breadth',v)} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
                <TextInput label="SUMMER DRAFT (m)" value={genSpecs.summerDraft} onChangeText={(v)=>updateSpec('summerDraft',v)} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
            </Surface>

            {/* DECK MODULE */}
            {dept === 'deck' && (
              <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Anchor size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Deck & Cargo Gear</Text></View>
                <TextInput label="CARGO HOLDS / TANKS (QTY)" value={deckSpecs.holds} onChangeText={(v)=>setDeckSpecs({...deckSpecs, holds: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <TextInput label="HATCH COVER TYPE" value={deckSpecs.hatchType} onChangeText={(v)=>setDeckSpecs({...deckSpecs, hatchType: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <View style={styles.inputRow}>
                    <TextInput label="CRANES (QTY)" value={deckSpecs.cranes} onChangeText={(v)=>setDeckSpecs({...deckSpecs, cranes: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="SWL (MT)" value={deckSpecs.swl} onChangeText={(v)=>setDeckSpecs({...deckSpecs, swl: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
                <TextInput label="BWMS TYPE" value={deckSpecs.bwms} onChangeText={(v)=>setDeckSpecs({...deckSpecs, bwms: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
              </Surface>
            )}

            {/* ENGINE MODULE */}
            {dept === 'engine' && (
              <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Cog size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Propulsion & Machinery</Text></View>
                <TextInput label="MAIN ENGINE MAKE/TYPE" value={engineSpecs.meMake} onChangeText={(v)=>setEngineSpecs({...engineSpecs, meMake: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <TextInput label="MCR (kW / RPM)" value={engineSpecs.meMcr} onChangeText={(v)=>setEngineSpecs({...engineSpecs, meMcr: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <View style={styles.inputRow}>
                    <TextInput label="AUX SETS (QTY)" value={engineSpecs.auxSets} onChangeText={(v)=>setEngineSpecs({...engineSpecs, auxSets: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="SFOC (g/kWh)" value={engineSpecs.sfoc} onChangeText={(v)=>setEngineSpecs({...engineSpecs, sfoc: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
                <TextInput label="BOILER TYPE" value={engineSpecs.boilerType} onChangeText={(v)=>setEngineSpecs({...engineSpecs, boilerType: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
              </Surface>
            )}

            {/* ETO MODULE */}
            {dept === 'eto' && (
              <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Zap size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Electrical Distribution</Text></View>
                <View style={styles.inputRow}>
                    <TextInput label="VOLTAGE (V)" value={etoSpecs.voltage} onChangeText={(v)=>setEtoSpecs({...etoSpecs, voltage: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="FREQ (Hz)" value={etoSpecs.frequency} onChangeText={(v)=>setEtoSpecs({...etoSpecs, frequency: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
                <TextInput label="MSB MAKE" value={etoSpecs.msbMake} onChangeText={(v)=>setEtoSpecs({...etoSpecs, msbMake: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <TextInput label="THRUSTER POWER (kW)" value={etoSpecs.thrusterKw} onChangeText={(v)=>setEtoSpecs({...etoSpecs, thrusterKw: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
              </Surface>
            )}

            {/* CATERING MODULE */}
            {dept === 'catering' && (
              <Surface style={styles.technicalCard}>
                <View style={styles.rowHeader}><Utensils size={18} color={theme.colors.primary} /><Text style={styles.specHeader}>Galley & Life Services</Text></View>
                <View style={styles.inputRow}>
                    <TextInput label="MEAT RM (m³)" value={cateringSpecs.meatRoomVol} onChangeText={(v)=>setCateringSpecs({...cateringSpecs, meatRoomVol: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1, marginRight: 8}]} editable={!isLocked} />
                    <TextInput label="VEG RM (m³)" value={cateringSpecs.vegRoomVol} onChangeText={(v)=>setCateringSpecs({...cateringSpecs, vegRoomVol: v})} mode="outlined" dense style={[styles.innerInput, {flex: 1}]} editable={!isLocked} />
                </View>
                <TextInput label="SEWAGE PLANT MAKE" value={cateringSpecs.stpMake} onChangeText={(v)=>setCateringSpecs({...cateringSpecs, stpMake: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
                <TextInput label="TOTAL BERTHS" value={cateringSpecs.berths} onChangeText={(v)=>setCateringSpecs({...cateringSpecs, berths: v})} mode="outlined" dense style={styles.innerInput} editable={!isLocked} />
              </Surface>
            )}
            
            <Button mode="contained" onPress={handleFinalLock} disabled={isLocked} style={styles.verifyBtn}>
              {isLocked ? "RECORDS LOCKED BY CTO" : "VERIFY DEPARTMENT DATA"}
            </Button>
          </View>
        ) : (
          <Surface style={styles.lockedVault}>
             <Lock size={30} color={theme.colors.outline} />
             <Text style={styles.lockedMsg}>Complete Safety Familiarization to unlock department-specific technical data.</Text>
          </Surface>
        )}
      </View>
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionWrapper: { paddingHorizontal: 16, marginTop: 16 },
  heroGradient: { borderRadius: 24, padding: 24, minHeight: 200 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between" },
  stepTag: { color: "rgba(255,255,255,0.6)", letterSpacing: 2, fontSize: 10, fontWeight: "900" },
  heroTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginTop: 8 },
  formInside: { marginTop: 15 },
  inputRow: { flexDirection: "row", marginBottom: 5 },
  flatInput: { backgroundColor: "transparent", height: 45, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.2)" },
  onboardBtn: { borderRadius: 12, marginTop: 15 },
  confirmedBox: { marginTop: 10 },
  confirmedText: { color: "#4ADE80", fontWeight: "800", fontSize: 14, marginBottom: 6 },
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
  verifyBtn: { borderRadius: 16, height: 50, justifyContent: "center", marginTop: 10 },
  lockedVault: { padding: 40, borderRadius: 24, alignItems: "center", borderStyle: "dashed", borderWidth: 2, borderColor: "rgba(0,0,0,0.1)", backgroundColor: "rgba(0,0,0,0.02)" },
  lockedMsg: { textAlign: "center", marginTop: 15, fontSize: 12, opacity: 0.5, lineHeight: 18 },
  bottomSpacer: { height: 100 },
});