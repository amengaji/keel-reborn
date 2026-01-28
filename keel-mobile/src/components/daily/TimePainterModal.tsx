//keel-mobile/src/components/daily/TimePainterModal.tsx

import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Text as RNText, 
  Modal, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
} from "react-native";
import { IconButton, Surface, Button, Text, SegmentedButtons } from "react-native-paper";
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  initialData: number[];
  onSave: (newData: number[]) => void;
  onCancel: () => void;
  isDeckCadet?: boolean;
}

export const TimePainterModal = ({ visible, initialData, onSave, onCancel, isDeckCadet = true }: Props) => {
  const [blocks, setBlocks] = useState<number[]>(new Array(48).fill(0));
  const [activeBrush, setActiveBrush] = useState<number>(1);
  const [vesselStatus, setVesselStatus] = useState<'SEA' | 'PORT'>('SEA');
  
  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastPaintedIndex = useRef<number>(-1);

  useEffect(() => {
    if (visible) {
      const cleanData = initialData && initialData.length === 48 ? [...initialData] : new Array(48).fill(0);
      setBlocks(cleanData);
      setActiveBrush(1); 
      lastPaintedIndex.current = -1;
    }
  }, [visible, initialData]);

  const handleReset = () => {
    Alert.alert("Reset Timeline", "Clear all entries?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => {
          setBlocks(new Array(48).fill(0));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
    ]);
  };

  /**
   * ✅ NEW: Collision Check & Smart Fill
   * Detects if the template will overwrite existing data.
   */
  const handleSmartFill = (type: 'WATCH' | 'DAY_WORK', startHour?: number) => {
    const next = [...blocks];
    const targetIndices: number[] = [];
    const watchBrush = vesselStatus === 'SEA' ? 2 : 3;

    // Determine target indices based on template
    if (type === 'WATCH' && startHour !== undefined) {
      const startIndex = startHour * 2;
      for (let i = 0; i < 8; i++) {
        targetIndices.push(startIndex + i);      // AM
        targetIndices.push(startIndex + 24 + i); // PM
      }
    } else if (type === 'DAY_WORK') {
      for (let i = 16; i < 24; i++) targetIndices.push(i); // 08-12
      for (let i = 26; i < 34; i++) targetIndices.push(i); // 13-17
    }

    // Check for collisions (any non-zero block in target area)
    const hasCollision = targetIndices.some(idx => blocks[idx] !== 0);

    const applyFill = () => {
      targetIndices.forEach(idx => {
        next[idx] = type === 'DAY_WORK' ? 1 : watchBrush;
      });
      setBlocks(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (hasCollision) {
      Alert.alert(
        "Data Collision",
        "This template will overwrite existing entries in these time slots. Proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Overwrite", style: "destructive", onPress: applyFill }
        ]
      );
    } else {
      applyFill();
    }
  };

  const paint = (pageX: number, pageY: number) => {
    const { x, y, width, height } = gridLayout.current;
    if (width === 0) return;
    const labelWidth = 40; 
    const relX = pageX - x - labelWidth;
    const relY = pageY - y;
    const drawableWidth = width - labelWidth;

    if (relX < 0 || relX > drawableWidth || relY < 0 || relY > height) return;

    const rowHeight = height / 2;
    const isSecondRow = relY > rowHeight;
    const index = (isSecondRow ? 24 : 0) + Math.floor(relX / (drawableWidth / 24));

    if (index >= 0 && index < 48 && index !== lastPaintedIndex.current) {
      lastPaintedIndex.current = index;
      setBlocks(current => {
        if (current[index] === activeBrush) return current;
        const next = [...current];
        next[index] = activeBrush;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return next;
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        evt.currentTarget.measure((_x, _y, width, height, pageX, pageY) => {
          gridLayout.current = { x: pageX, y: pageY, width, height };
          paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        });
      },
      onPanResponderMove: (evt) => paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderRelease: () => { lastPaintedIndex.current = -1; }
    })
  ).current;

  const getBlockColor = (val: number) => {
    switch(val) {
      case 1: return "#F59E0B"; 
      case 2: return "#3B82F6"; 
      case 3: return "#8B5CF6"; 
      case 4: return "#EC4899"; 
      default: return "#10B981"; 
    }
  };

  const brushes = [
    { id: 1, label: "WORK", color: "#F59E0B", icon: "hammer-wrench" },
    ...(vesselStatus === 'SEA' 
      ? [{ id: 2, label: "WATCH", color: "#3B82F6", icon: "compass" }, { id: 4, label: "STEER", color: "#EC4899", icon: "ship-wheel" }] 
      : [{ id: 3, label: "WATCH", color: "#8B5CF6", icon: "anchor" }]),
    { id: 0, label: "ERASE", color: "#10B981", icon: "eraser" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
            <IconButton icon="close" size={24} onPress={onCancel} />
            <Text style={styles.headerTitle}>Watchkeeper Log</Text>
            <Button mode="text" onPress={() => onSave(blocks)} textColor="#3194A0" labelStyle={{fontWeight: '900'}}>SAVE</Button>
        </View>

        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
            <SegmentedButtons
                value={vesselStatus}
                onValueChange={(v) => { setVesselStatus(v as any); Haptics.selectionAsync(); }}
                buttons={[{ value: 'SEA', label: 'At Sea', icon: 'ferry' }, { value: 'PORT', label: 'In Port', icon: 'anchor' }]}
                theme={{ colors: { secondaryContainer: '#3194A0' }}}
                style={styles.segmented}
            />

            <Text style={styles.sectionLabel}>SMART FILL TEMPLATES</Text>
            <View style={styles.smartFillGrid}>
              {[
                { l: "12-4 Watch", s: 0 }, { l: "4-8 Watch", s: 4 }, 
                { l: "8-12 Watch", s: 8 }, { l: "Day Worker", s: null, type: 'DAY_WORK' }
              ].map((w, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.smartFillBtn, w.type === 'DAY_WORK' && {borderColor: '#F59E0B'}]} 
                  onPress={() => w.type === 'DAY_WORK' ? handleSmartFill('DAY_WORK') : handleSmartFill('WATCH', w.s!)}
                >
                  <RNText style={[styles.smartFillText, w.type === 'DAY_WORK' && {color: '#D97706'}]}>{w.l}</RNText>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>TOOLS</Text>
            <View style={styles.brushGrid}>
              {brushes.map(b => (
                  <TouchableOpacity 
                      key={b.id} 
                      onPress={() => { setActiveBrush(b.id); Haptics.selectionAsync(); }}
                      style={[styles.brushItem, activeBrush === b.id && { backgroundColor: b.color, borderColor: b.color }]}
                  >
                      <IconButton icon={b.icon} size={18} iconColor={activeBrush === b.id ? '#FFF' : '#64748B'} style={styles.brushIcon} />
                      <RNText style={[styles.brushText, activeBrush === b.id && { color: '#FFF' }]}>{b.label}</RNText>
                  </TouchableOpacity>
              ))}
            </View>

            <Surface elevation={2} style={styles.painterSurface}>
                <View style={styles.gridContainer} {...panResponder.panHandlers}>
                    {[0, 24].map((offset, rowIdx) => (
                        <View key={rowIdx} style={{marginBottom: rowIdx === 0 ? 35 : 0}}>
                            <View style={styles.row}>
                                <RNText style={styles.rowLabel}>{rowIdx === 0 ? 'AM' : 'PM'}</RNText>
                                <View style={styles.blocksRow}>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <View key={i} style={[styles.block, { backgroundColor: getBlockColor(blocks[i + offset]), borderRightWidth: i % 2 === 1 ? 1 : 0.2, borderRightColor: 'rgba(0,0,0,0.05)' }]} />
                                    ))}
                                </View>
                            </View>
                            <View style={styles.timeLabels}>
                                {[0, 4, 8, 12].map(h => (
                                    <RNText key={h} style={styles.timeText}>{String(h + (rowIdx * 12)).padStart(2, '0')}</RNText>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            </Surface>

            <Button icon="refresh" mode="text" onPress={handleReset} textColor="#94A3B8" labelStyle={{fontSize: 10}}>RESET TIMELINE</Button>
            <View style={{height: 40}} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 56, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  scrollContent: { padding: 16, alignItems: 'center' },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10, marginTop: 20, alignSelf: 'flex-start' },
  segmented: { width: '100%', height: 40 },
  smartFillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  smartFillBtn: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  smartFillText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  brushGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%' },
  brushItem: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, height: 32, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', flexGrow: 1, justifyContent: 'center' },
  brushIcon: { margin: 0, padding: 0 },
  brushText: { fontSize: 9, fontWeight: '800' },
  painterSurface: { padding: 16, borderRadius: 20, backgroundColor: '#FFF', width: '100%', marginTop: 20 },
  gridContainer: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', height: 50 },
  rowLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', width: 40 },
  blocksRow: { flex: 1, flexDirection: 'row', height: '100%', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  block: { flex: 1, height: '100%' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 40, marginTop: 4 },
  timeText: { fontSize: 8, fontWeight: '800', color: '#CBD5E1' }
});