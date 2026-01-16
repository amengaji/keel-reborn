//keel-mobile/src/screens/WatchEntryScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, useTheme, Surface, Divider } from "react-native-paper";
import { Clock, MapPin, ShieldCheck } from "lucide-react-native";
import DateInputField from "../components/inputs/DateInputField";
import TimeInputField from "../components/inputs/TimeInputField";
import LatLongInput from "../components/inputs/LatLongInput";
import YesNoCapsule from "../components/common/YesNoCapsule";

/**
 * WATCH ENTRY SCREEN — Professional Maritime Log
 * PURPOSE: Allow Trainees to record official watchkeeping data.
 * UX: Grouped inputs with maritime icons for better visual context.
 */
export const WatchEntryScreen = () => {
  const theme = useTheme();

  // Form State
  const [watchDate, setWatchDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isUnderway, setIsUnderway] = useState(true);
  
  const [latData, setLatData] = useState({
    degrees: null as number | null,
    minutes: null as number | null,
    direction: "N" as any,
    isValid: false
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.formPadding}>
        
        {/* SECTION 1: WATCH TIMING */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>WATCH PERIOD</Text>
          </View>
          <Divider style={styles.divider} />
          
          <DateInputField label="Watch Date" value={watchDate} onChange={setWatchDate} required />
          <View style={styles.verticalSpacer} />
          <TimeInputField label="Start Time (UTC)" value={startTime} onChange={setStartTime} required />
        </Surface>

        {/* SECTION 2: POSITION DATA */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <MapPin size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>FIXED POSITION</Text>
          </View>
          <Divider style={styles.divider} />
          
          <LatLongInput 
            label="Latitude" 
            type="LAT" 
            degrees={latData.degrees} 
            minutes={latData.minutes} 
            direction={latData.direction} 
            onChange={setLatData} 
          />
          <View style={styles.verticalSpacer} />
          <LatLongInput 
            label="Longitude" 
            type="LON" 
            degrees={null} 
            minutes={null} 
            direction="E" 
            onChange={() => {}} 
          />
        </Surface>

        {/* SECTION 3: SAFETY & STATUS */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>VESSEL STATUS</Text>
          </View>
          <Divider style={styles.divider} />
          
          <View style={styles.capsuleRow}>
            <Text variant="bodyMedium" style={styles.capsuleLabel}>Is Vessel Underway?</Text>
            <YesNoCapsule value={isUnderway} onChange={setIsUnderway} />
          </View>
        </Surface>

        <Button 
          mode="contained" 
          onPress={() => console.log("Watch Logged")}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
        >
          SUBMIT WATCH LOG
        </Button>
        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formPadding: { padding: 16 },
  card: { borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { marginLeft: 10, fontSize: 12, fontWeight: '900', color: 'rgba(128,128,128,0.8)', letterSpacing: 1 },
  divider: { marginBottom: 16, opacity: 0.3 },
  verticalSpacer: { height: 16 },
  capsuleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capsuleLabel: { fontWeight: '600' },
  submitBtn: { marginTop: 8, borderRadius: 14 },
  submitBtnContent: { height: 56 },
  bottomSpace: { height: 40 }
});