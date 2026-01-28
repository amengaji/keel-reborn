//keel-mobile/src/screens/daily/DailyLogScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity, Vibration } from "react-native";
import { Text, Surface, IconButton, useTheme, TextInput, ActivityIndicator } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Navigation, Edit3 } from "lucide-react-native";
import * as Location from 'expo-location';

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelButton } from "../../components/ui/KeelButton";
import { KeelCard } from "../../components/ui/KeelCard";
import { useToast } from "../../components/toast/useToast";

import { TimePainter } from "../../components/daily/TimePainter";
import { DailyHistoryList } from "../../components/daily/DailyHistoryList";
import { 
    getLogByDate, 
    upsertDailyLog, 
    ensureDailyLogsTable, 
    getAllDailyLogs, 
    DailyLogRecord, 
    deleteDailyLogById 
} from "../../db/dailyLogs";

const getTodayStr = () => new Date().toISOString().split('T')[0];

export default function DailyLogScreen() {
    const theme = useTheme();
    const toast = useToast();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    
    const [viewMode, setViewMode] = useState<"EDIT" | "HISTORY">("EDIT");
    const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
    const [historyLogs, setHistoryLogs] = useState<DailyLogRecord[]>([]);
    
    const [activityData, setActivityData] = useState<number[]>(new Array(48).fill(0));
    const [stats, setStats] = useState({ rest: 24, work: 0, watch: 0, steering: 0 });
    const [remarks, setRemarks] = useState("");
    const [positionLat, setPositionLat] = useState("");
    const [positionLong, setPositionLong] = useState("");

    const [hasChanges, setHasChanges] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);

    /**
     * ✅ FIX: Migration/Table Init
     * We run this only once when the screen mounts, not on every focus/render.
     * This prevents the "Migrating daily_logs table..." infinite loop.
     */
    useEffect(() => {
        console.log(">>> INITIALIZING DAILY LOGS TABLE SCHEMA");
        ensureDailyLogsTable();
    }, []);

    /**
     * Deep Link Handler:
     * When navigating from the ComplianceTrend card (One-Tap Fix), 
     * update the selected date and switch to EDIT mode.
     */
    useEffect(() => {
        if (route.params?.date) {
            setSelectedDate(route.params.date);
            setViewMode("EDIT");
        }
    }, [route.params?.date]);

    // Load Data whenever date or view mode changes
    useFocusEffect(
        useCallback(() => {
            if (viewMode === "EDIT") {
                loadLog(selectedDate);
            } else {
                loadHistory();
            }
        }, [selectedDate, viewMode])
    );

    const loadLog = (date: string) => {
        const record = getLogByDate(date);
        if (record) {
            try {
                const parsed = JSON.parse(record.activityJson);
                setActivityData(parsed);
                
                let r = 0, w = 0, wt = 0, st = 0;
                parsed.forEach((x: number) => { 
                    if(x === 0) r += 0.5; 
                    if(x === 1) w += 0.5; 
                    if(x === 2 || x === 3) wt += 0.5;
                    if(x === 4) st += 0.5; 
                });
                setStats({ rest: r, work: w, watch: wt, steering: st });
                setRemarks(record.remarks || "");
                setPositionLat(record.positionLat || "");
                setPositionLong(record.positionLong || "");
            } catch (e) { 
                console.error("Error parsing log activity:", e); 
            }
        } else {
            setActivityData(new Array(48).fill(0));
            setStats({ rest: 24, work: 0, watch: 0, steering: 0 });
            setRemarks(""); 
            setPositionLat(""); 
            setPositionLong("");
        }
        setHasChanges(false);
    };

    const loadHistory = () => {
        const all = getAllDailyLogs();
        setHistoryLogs(all);
    };

    const assignmentTotals = useMemo(() => {
        let seaWatch = 0, portWatch = 0, work = 0, steering = 0;
        historyLogs.forEach(log => {
            try {
                const data = JSON.parse(log.activityJson);
                data.forEach((v: number) => {
                    if (v === 1) work += 0.5;
                    if (v === 2) seaWatch += 0.5;
                    if (v === 3) portWatch += 0.5;
                    if (v === 4) steering += 0.5;
                });
            } catch (e) {}
        });
        return { seaWatch, portWatch, work, steering };
    }, [historyLogs]);

    const handlePainterChange = (newData: number[], newStats: any) => {
        setActivityData(newData);
        setStats(newStats);
        setHasChanges(true);
    };

    const handleSave = () => {
        // ✅ Calculate totals locally for precision during save
        let r = 0, w = 0, sw = 0, pw = 0, st = 0;
        activityData.forEach((x: number) => { 
            if(x === 0) r += 0.5; 
            if(x === 1) w += 0.5; 
            if(x === 2) sw += 0.5; 
            if(x === 3) pw += 0.5;
            if(x === 4) st += 0.5;
        });

        upsertDailyLog({
            date: selectedDate,
            activityJson: JSON.stringify(activityData),
            totalRest: r,
            totalWork: w,
            totalWatch: (sw + pw),
            totalSteering: st,
            remarks,
            positionLat,
            positionLong
        });
        
        setHasChanges(false);
        toast.success("Daily Log Saved");
        loadHistory(); 
    };

    const handleGetLocation = async () => {
        setIsGpsLoading(true);
        Vibration.vibrate(10);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                toast.error("Location permission denied");
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const lat = location.coords.latitude;
            const latStr = `${Math.floor(Math.abs(lat)).toString().padStart(2, '0')}° ${((Math.abs(lat) % 1) * 60).toFixed(1)}' ${lat >= 0 ? "N" : "S"}`;
            const long = location.coords.longitude;
            const longStr = `${Math.floor(Math.abs(long)).toString().padStart(3, '0')}° ${((Math.abs(long) % 1) * 60).toFixed(1)}' ${long >= 0 ? "E" : "W"}`;
            
            setPositionLat(latStr); 
            setPositionLong(longStr);
            setHasChanges(true);
            toast.success("Location Updated");
        } catch (e) { 
            toast.error("Failed to fetch location"); 
        } finally { 
            setIsGpsLoading(false); 
        }
    };

    const isCompliant = stats.rest >= 10; 

    return (
        <KeelScreen style={{ paddingHorizontal: 0 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                
                {/* VIEW SELECTOR TABS */}
                <Surface style={styles.tabWrapper} elevation={1}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tab, viewMode === "EDIT" && { backgroundColor: theme.colors.primary }]} 
                            onPress={() => setViewMode("EDIT")}
                        >
                            <Text style={[styles.tabText, viewMode === "EDIT" && { color: 'white' }]}>Log Entry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, viewMode === "HISTORY" && { backgroundColor: theme.colors.primary }]} 
                            onPress={() => setViewMode("HISTORY")}
                        >
                            <Text style={[styles.tabText, viewMode === "HISTORY" && { color: 'white' }]}>History</Text>
                        </TouchableOpacity>
                    </View>
                </Surface>

                {viewMode === "EDIT" ? (
                    <>
                        {/* DATE SELECTOR */}
                        <Surface style={styles.header} elevation={0}>
                            <IconButton icon="chevron-left" onPress={() => {
                                const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} />
                            <View style={{ alignItems: 'center' }}>
                                <Text variant="titleMedium" style={{ fontWeight: '800' }}>
                                    {selectedDate === getTodayStr() ? "Today" : selectedDate}
                                </Text>
                            </View>
                            <IconButton icon="chevron-right" onPress={() => {
                                const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} />
                        </Surface>

                        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
                            
                            {/* STATS HUD */}
                            <View style={styles.statsRow}>
                                <KeelCard style={StyleSheet.flatten([styles.statBox, { borderColor: isCompliant ? '#10B981' : '#EF4444', borderWidth: 1 }])}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>REST</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: isCompliant ? '#10B981' : '#EF4444' }}>{stats.rest}</Text>
                                </KeelCard>
                                <KeelCard style={styles.statBox}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>WATCH</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: '#3B82F6' }}>{stats.watch}</Text>
                                </KeelCard>
                                <KeelCard style={styles.statBox}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>STEER</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: '#EC4899' }}>{stats.steering}</Text>
                                </KeelCard>
                            </View>

                            <Text variant="titleSmall" style={styles.sectionTitle}>Activity Timeline</Text>
                            <TimePainter activityData={activityData} onChange={handlePainterChange} isDeckCadet={true} />

                            {/* NOON REPORT HEADER */}
                            <View style={styles.noonReportHeader}>
                                <Text variant="titleSmall" style={styles.sectionTitle}>Noon Report</Text>
                                <TouchableOpacity onPress={handleGetLocation} disabled={isGpsLoading} style={styles.gpsBadge}>
                                    {isGpsLoading ? <ActivityIndicator size={12} color="#3194A0" /> : <Navigation size={12} color="#3194A0" />}
                                    <Text style={styles.gpsBadgeText}>SYNC GPS</Text>
                                </TouchableOpacity>
                            </View>

                            {/* MODERN NOON REPORT CARD */}
                            <Surface style={styles.noonCard} elevation={2}>
                                <View style={styles.noonRow}>
                                    <View style={styles.inputHalf}>
                                        <View style={styles.inputHeader}>
                                            <MapPin size={14} color="#6B7280" />
                                            <Text style={styles.inputLabel}>LATITUDE</Text>
                                        </View>
                                        <TextInput 
                                            value={positionLat} 
                                            onChangeText={(t) => { setPositionLat(t); setHasChanges(true); }} 
                                            placeholder="00° 00.0' N"
                                            style={styles.cleanInput}
                                            contentStyle={{paddingLeft: 0}}
                                            underlineColor="transparent"
                                            activeUnderlineColor="#3194A0"
                                        />
                                    </View>
                                    <View style={styles.dividerVertical} />
                                    <View style={styles.inputHalf}>
                                        <View style={styles.inputHeader}>
                                            <Navigation size={14} color="#6B7280" style={{transform: [{rotate: '45deg'}]}} />
                                            <Text style={styles.inputLabel}>LONGITUDE</Text>
                                        </View>
                                        <TextInput 
                                            value={positionLong} 
                                            onChangeText={(t) => { setPositionLong(t); setHasChanges(true); }} 
                                            placeholder="000° 00.0' E"
                                            style={styles.cleanInput}
                                            contentStyle={{paddingLeft: 0}}
                                            underlineColor="transparent"
                                            activeUnderlineColor="#3194A0"
                                        />
                                    </View>
                                </View>

                                <View style={styles.dividerHorizontal} />

                                <View style={styles.remarksSection}>
                                    <View style={styles.inputHeader}>
                                        <Edit3 size={14} color="#6B7280" />
                                        <Text style={styles.inputLabel}>REMARKS & ACTIVITIES</Text>
                                    </View>
                                    <TextInput 
                                        multiline 
                                        value={remarks} 
                                        onChangeText={(t) => { setRemarks(t); setHasChanges(true); }} 
                                        placeholder="Enter manual steering details, drills, or cargo ops..."
                                        style={styles.remarksInput}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                    />
                                </View>
                            </Surface>
                        </ScrollView>

                        {/* FLOATING SAVE BUTTON */}
                        {hasChanges && (
                            <View style={[styles.fabContainer, { bottom: insets.bottom + 16 }]}>
                                <KeelButton mode="primary" onPress={handleSave}>Confirm Daily Log</KeelButton>
                            </View>
                        )}
                    </>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                        
                        {/* CUMULATIVE SUMMARY */}
                        <Surface style={styles.summaryCard} elevation={2}>
                            <Text variant="labelMedium" style={styles.summaryTitle}>CUMULATIVE PROGRESS</Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, {color: '#3B82F6'}]}>{assignmentTotals.seaWatch}h</Text>
                                    <Text style={styles.summaryLab}>WATCH</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, {color: '#EC4899'}]}>{assignmentTotals.steering}h</Text>
                                    <Text style={styles.summaryLab}>STEER</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, {color: '#F59E0B'}]}>{assignmentTotals.work}h</Text>
                                    <Text style={styles.summaryLab}>WORK</Text>
                                </View>
                            </View>
                        </Surface>

                        {/* HISTORY LIST */}
                        <DailyHistoryList 
                            logs={historyLogs} 
                            onSelectDate={(date) => { setSelectedDate(date); setViewMode("EDIT"); }} 
                            onDelete={(id) => { deleteDailyLogById(id); loadHistory(); toast.success("Log deleted"); }} 
                        />
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </KeelScreen>
    );
}

const styles = StyleSheet.create({
    tabWrapper: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabText: { fontWeight: '700', color: '#6B7280', fontSize: 13 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#F9FAFB' },
    sectionTitle: { fontWeight: '900', color: '#1F2937', fontSize: 14, letterSpacing: 0.5 },
    
    noonReportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2F1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    gpsBadgeText: { fontSize: 10, fontWeight: '900', color: '#3194A0' },
    noonCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    noonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    inputHalf: { flex: 1 },
    inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    inputLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 },
    cleanInput: { backgroundColor: 'transparent', height: 40, fontSize: 16, fontWeight: '700' },
    dividerVertical: { width: 1, height: '100%', backgroundColor: '#F3F4F6', marginHorizontal: 15 },
    dividerHorizontal: { height: 1, width: '100%', backgroundColor: '#F3F4F6', marginVertical: 15 },
    remarksSection: { width: '100%' },
    remarksInput: { backgroundColor: 'transparent', fontSize: 14, minHeight: 60, paddingHorizontal: 0, textAlignVertical: 'top' },

    fabContainer: { position: 'absolute', left: 20, right: 20 },
    summaryCard: { backgroundColor: '#1A2426', borderRadius: 24, padding: 20, marginBottom: 20 },
    summaryTitle: { color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryVal: { fontSize: 24, fontWeight: '900' },
    summaryLab: { color: '#FFF', fontSize: 9, fontWeight: '800', marginTop: 4 }
});