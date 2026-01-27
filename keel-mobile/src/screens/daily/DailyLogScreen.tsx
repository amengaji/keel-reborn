//keel-mobile/src/screens/daily/DailyLogScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton, useTheme, TextInput, ActivityIndicator } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    
    // UI State
    const [viewMode, setViewMode] = useState<"EDIT" | "HISTORY">("EDIT");
    const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
    const [historyLogs, setHistoryLogs] = useState<DailyLogRecord[]>([]);
    
    // Log Data State
    const [activityData, setActivityData] = useState<number[]>(new Array(48).fill(0));
    const [stats, setStats] = useState({ rest: 24, work: 0, watch: 0 });
    const [remarks, setRemarks] = useState("");
    const [positionLat, setPositionLat] = useState("");
    const [positionLong, setPositionLong] = useState("");

    const [hasChanges, setHasChanges] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);

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

    // Load Data on focus or date change
    useFocusEffect(
        useCallback(() => {
            ensureDailyLogsTable();
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
                
                let r = 0, w = 0, wt = 0;
                parsed.forEach((x: number) => { 
                    if(x === 0) r += 0.5; 
                    if(x === 1) w += 0.5; 
                    if(x === 2) wt += 0.5; 
                });
                setStats({ rest: r, work: w, watch: wt });

                setRemarks(record.remarks || "");
                setPositionLat(record.positionLat || "");
                setPositionLong(record.positionLong || "");
            } catch (e) { 
                console.error(e); 
            }
        } else {
            setActivityData(new Array(48).fill(0));
            setStats({ rest: 24, work: 0, watch: 0 });
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

    const handlePainterChange = (newData: number[], newStats: any) => {
        setActivityData(newData);
        setStats(newStats);
        setHasChanges(true);
    };

    const handleSave = () => {
        upsertDailyLog({
            date: selectedDate,
            activityJson: JSON.stringify(activityData),
            totalRest: stats.rest,
            totalWork: stats.work,
            totalWatch: stats.watch,
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
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
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
                        {/* DATE SELECTOR HEADER */}
                        <Surface style={styles.header} elevation={0}>
                            <IconButton icon="chevron-left" onPress={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} />
                            <View style={{ alignItems: 'center' }}>
                                <Text variant="titleMedium" style={{ fontWeight: '800' }}>
                                    {selectedDate === getTodayStr() ? "Today" : selectedDate}
                                </Text>
                            </View>
                            <IconButton icon="chevron-right" onPress={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} />
                        </Surface>

                        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
                            {/* STATS OVERVIEW */}
                            <View style={styles.statsRow}>
                                <KeelCard style={StyleSheet.flatten([styles.statBox, { borderColor: isCompliant ? '#10B981' : '#EF4444', borderWidth: 1 }])}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>REST HOURS</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: isCompliant ? '#10B981' : '#EF4444' }}>{stats.rest}</Text>
                                    <Text variant="bodySmall" style={{ fontSize: 10, color: isCompliant ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                                        {isCompliant ? "COMPLIANT" : "VIOLATION"}
                                    </Text>
                                </KeelCard>
                                <KeelCard style={styles.statBox}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>WORK</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: '#F59E0B' }}>{stats.work}</Text>
                                </KeelCard>
                                <KeelCard style={styles.statBox}>
                                    <Text variant="labelSmall" style={{ color: '#6B7280' }}>WATCH</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: '800', color: '#3B82F6' }}>{stats.watch}</Text>
                                </KeelCard>
                            </View>

                            <Text variant="titleSmall" style={styles.sectionTitle}>Activity Log</Text>
                            <TimePainter activityData={activityData} onChange={handlePainterChange} isDeckCadet={true} />

                            <Text variant="titleSmall" style={styles.sectionTitle}>Noon Report</Text>
                            <KeelCard>
                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, gap: 12 }}>
                                        <TextInput mode="outlined" label="Latitude" style={{ backgroundColor: 'white' }} value={positionLat} onChangeText={(t) => { setPositionLat(t); setHasChanges(true); }} />
                                        <TextInput mode="outlined" label="Longitude" style={{ backgroundColor: 'white' }} value={positionLong} onChangeText={(t) => { setPositionLong(t); setHasChanges(true); }} />
                                    </View>
                                    <View style={{ justifyContent: 'center', height: 130 }}>
                                        <IconButton icon={isGpsLoading ? "loading" : "crosshairs-gps"} mode="contained-tonal" size={28} onPress={handleGetLocation} disabled={isGpsLoading} style={{ height: 56, width: 56, borderRadius: 12 }} />
                                    </View>
                                </View>
                                <TextInput mode="outlined" label="Remarks / Activity" multiline style={{ marginTop: 12, backgroundColor: 'white', minHeight: 80 }} value={remarks} onChangeText={(t) => { setRemarks(t); setHasChanges(true); }} />
                            </KeelCard>
                        </ScrollView>

                        {hasChanges && (
                            <View style={[styles.fabContainer, { bottom: insets.bottom + 16 }]}>
                                <KeelButton mode="primary" onPress={handleSave}>Save Daily Log</KeelButton>
                            </View>
                        )}
                    </>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                        <DailyHistoryList 
                            logs={historyLogs} 
                            onSelectDate={(date) => {
                                setSelectedDate(date);
                                setViewMode("EDIT");
                            }} 
                            onDelete={(id) => {
                                deleteDailyLogById(id); 
                                loadHistory(); 
                                toast.success("Log deleted");
                            }}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: 'transparent' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#F9FAFB' },
    sectionTitle: { fontWeight: '800', marginBottom: 12, color: '#1F2937', marginTop: 8 },
    fabContainer: { position: 'absolute', left: 20, right: 20 }
});