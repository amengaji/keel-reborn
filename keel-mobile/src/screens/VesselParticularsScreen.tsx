//keel-mobile/src/screens/VesselParticularsScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, useTheme, Surface, SegmentedButtons, TouchableRipple, Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ship, Cog, Zap, Utensils, Anchor, ShieldAlert, ArrowRight, Calendar, MapPin, Lock, CheckCircle2 } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import DateInputField from "../components/inputs/DateInputField";
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const VesselParticularsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  const [workflowStep, setWorkflowStep] = useState(1); 
  const [dept, setDept] = useState('deck');
  const [signOnDate, setSignOnDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");

  const handleSignOn = () => {
    if (!port) {
      Toast.show({ type: 'error', text1: 'Port Missing', text2: 'Please enter your Port of Engagement.' });
      return;
    }
    setWorkflowStep(2);
    Toast.show({ type: 'success', text1: 'Sign-On Recorded', text2: 'Proceed to Safety Familiarization.' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* 1. SIGN ON HEADER */}
      <View style={styles.sectionWrapper}>
        <LinearGradient
          colors={workflowStep === 1 ? [theme.colors.primary, '#1A2426'] : ['#2C3E50', '#1A1A1A']}
          style={styles.heroGradient}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.stepTag}>STEP 01</Text>
            {workflowStep > 1 && <CheckCircle2 size={20} color="#4ADE80" />}
          </View>
          <Text style={styles.heroTitle}>Vessel Sign-On</Text>
          
          {workflowStep === 1 ? (
            <View style={styles.formInside}>
              <DateInputField label="Joining Date" value={signOnDate} onChange={setSignOnDate} required />
              <TextInput 
                mode="flat" 
                placeholder="Port of Joining (e.g. Singapore)" 
                value={port} 
                onChangeText={setPort} 
                textColor="#FFF"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.flatInput}
              />
              <Button mode="contained" onPress={handleSignOn} style={styles.onboardBtn} buttonColor="#FFF" textColor={theme.colors.primary}>
                Confirm Joining
              </Button>
            </View>
          ) : (
            <Text style={styles.confirmedText}>Joined at {port.toUpperCase()} on {signOnDate?.toLocaleDateString()}</Text>
          )}
        </LinearGradient>
      </View>

      {/* 2. SAFETY FAMILIARIZATION */}
      <View style={[styles.sectionWrapper, workflowStep < 2 && styles.lockedOpacity]}>
        <Surface style={styles.glassCard} elevation={workflowStep === 2 ? 4 : 0}>
          <TouchableRipple 
            onPress={() => workflowStep === 2 && navigation.navigate('SafetyMap')}
            style={styles.ripple}
            disabled={workflowStep !== 2}
          >
            <View style={styles.safetyContent}>
              <View style={styles.iconCircle}>
                <ShieldAlert color={workflowStep === 2 ? theme.colors.error : theme.colors.outline} size={24} />
              </View>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.stepTagAlt}>STEP 02</Text>
                <Text style={styles.cardMainLabel}>Safety Familiarization</Text>
              </View>
              {workflowStep < 2 ? <Lock size={20} color={theme.colors.outline} /> : <ArrowRight size={20} color={theme.colors.primary} />}
            </View>
          </TouchableRipple>
          {workflowStep === 2 && (
             <Button mode="text" onPress={() => setWorkflowStep(3)} textColor={theme.colors.primary}>Simulate Completion</Button>
          )}
        </Surface>
      </View>

      {/* 3. TECHNICAL SPECIFICATIONS (All Departments) */}
      <View style={[styles.sectionWrapper, workflowStep < 3 && styles.lockedOpacity]}>
        <Text style={styles.technicalHeader}>VESSEL SPECIFICATIONS</Text>
        <SegmentedButtons
          value={dept}
          onValueChange={setDept}
          style={styles.segment}
          buttons={[
            { value: 'deck', label: 'DECK', disabled: workflowStep < 3, icon: () => <Anchor size={16} color={dept === 'deck' ? '#FFF' : theme.colors.primary} /> },
            { value: 'engine', label: 'ENGINE', disabled: workflowStep < 3, icon: () => <Cog size={16} color={dept === 'engine' ? '#FFF' : theme.colors.primary} /> },
            { value: 'eto', label: 'ETO', disabled: workflowStep < 3, icon: () => <Zap size={16} color={dept === 'eto' ? '#FFF' : theme.colors.primary} /> },
            { value: 'catering', label: 'CATERING', disabled: workflowStep < 3, icon: () => <Utensils size={16} color={dept === 'catering' ? '#FFF' : theme.colors.primary} /> },
          ]}
        />

        {workflowStep === 3 ? (
          <View style={styles.specsContainer}>
             {dept === 'deck' && <DeckSpecs />}
             {dept === 'engine' && <EngineSpecs />}
             {dept === 'eto' && <ETOSpecs />}
             {dept === 'catering' && <CateringSpecs />}
          </View>
        ) : (
          <Surface style={styles.lockedVault}>
             <Lock size={30} color={theme.colors.outline} />
             <Text style={styles.lockedMsg}>Unlock full technical specifications after Safety Familiarization.</Text>
          </Surface>
        )}
      </View>
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// --- DATA ROWS & CARDS ---

const DataRow = ({ label, value }: any) => (
  <View style={styles.dataRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const DeckSpecs = () => (
  <Surface style={styles.technicalCard}>
    <Text style={styles.specHeader}>Navigational Suite</Text>
    <DataRow label="Radar 1" value="X-Band ARPA (25kW)" />
    <DataRow label="ECDIS" value="Dual Furuno FMD-3200" />
    <DataRow label="AIS" value="Class A Universal" />
  </Surface>
);

const EngineSpecs = () => (
  <Surface style={styles.technicalCard}>
    <Text style={styles.specHeader}>Main Propulsion</Text>
    <DataRow label="Main Engine" value="MAN B&W 6G70ME-C9.5" />
    <DataRow label="MCR" value="18,500 kW @ 78 RPM" />
    <DataRow label="Boilers" value="2 x Mitsubishi Composite" />
  </Surface>
);

const ETOSpecs = () => (
  <Surface style={styles.technicalCard}>
    <Text style={styles.specHeader}>Power Distribution</Text>
    <DataRow label="Main Bus" value="440V / 60Hz" />
    <DataRow label="MSB" value="Terasaki Dead-front" />
    <DataRow label="UPS" value="3 x 10kVA Online" />
  </Surface>
);

const CateringSpecs = () => (
  <Surface style={styles.technicalCard}>
    <Text style={styles.specHeader}>Galley & Provisioning</Text>
    <DataRow label="Meat Room" value="-18°C / 20 m³" />
    <DataRow label="Veg Room" value="+4°C / 15.5 m³" />
    <DataRow label="Incinerator" value="TeamTec OG200" />
    <DataRow label="Galley Power" value="All Electric (440V)" />
  </Surface>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionWrapper: { paddingHorizontal: 16, marginTop: 16 },
  heroGradient: { borderRadius: 24, padding: 24, minHeight: 180 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepTag: { color: 'rgba(255,255,255,0.6)', letterSpacing: 2, fontSize: 10, fontWeight: '900' },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 8 },
  formInside: { marginTop: 20 },
  flatInput: { backgroundColor: 'transparent', height: 50, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  onboardBtn: { borderRadius: 12, marginTop: 10 },
  confirmedText: { color: '#4ADE80', fontWeight: '800', marginTop: 15, fontSize: 14 },
  lockedOpacity: { opacity: 0.5 },
  glassCard: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF' },
  ripple: { padding: 20 },
  safetyContent: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center' },
  stepTagAlt: { fontSize: 10, fontWeight: '900', opacity: 0.4, letterSpacing: 1 },
  cardMainLabel: { fontSize: 16, fontWeight: '800' },
  technicalHeader: { fontSize: 12, fontWeight: '900', color: 'rgba(128,128,128,0.6)', letterSpacing: 1.5, marginBottom: 12 },
  segment: { marginBottom: 15 },
  specsContainer: { marginTop: 10 },
  technicalCard: { borderRadius: 24, padding: 24, marginBottom: 15, backgroundColor: '#FFF' },
  specHeader: { fontWeight: '900', fontSize: 14, color: '#3194A0', marginBottom: 15, textTransform: 'uppercase' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { fontSize: 13, opacity: 0.6 },
  rowValue: { fontSize: 13, fontWeight: '800' },
  lockedVault: { padding: 40, borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.02)' },
  lockedMsg: { textAlign: 'center', marginTop: 15, fontSize: 12, opacity: 0.5, lineHeight: 18 },
  bottomSpacer: { height: 100 }
});