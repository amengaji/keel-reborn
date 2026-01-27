//keel-mobile/src/components/daily/TimePainterModal.tsx

import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Text as RNText, 
  Vibration, 
  Modal, 
  SafeAreaView, 
  TouchableOpacity,
  Alert
} from "react-native";
import { IconButton, Surface, Button, Text } from "react-native-paper";

interface Props {
  visible: boolean;
  initialData: number[];
  onSave: (newData: number[]) => void;
  onCancel: () => void;
  isDeckCadet?: boolean; // ✅ Added support for stream-based filtering
}

const BRUSHES = [
  { id: 1, label: "WORK", color: "#F59E0B", icon: "hammer-wrench" },
  { id: 2, label: "WATCH", color: "#3B82F6", icon: "compass" },
  { id: 0, label: "ERASER", color: "#10B981", icon: "eraser" },
];

export const TimePainterModal = ({ visible, initialData, onSave, onCancel, isDeckCadet = true }: Props) => {
  // Local state to track changes before "Done" is pressed
  const [blocks, setBlocks] = useState<number[]>(new Array(48).fill(0));
  const [activeBrush, setActiveBrush] = useState(1);
  
  const gridRef = useRef<View>(null);
  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastPaintedIndex = useRef<number>(-1);

  // Sync internal state when modal opens
  useEffect(() => {
    if (visible) {
      setBlocks([...initialData]);
    }
  }, [visible, initialData]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Capture grid position on screen to ensure coordinate accuracy
        gridRef.current?.measure((x, y, width, height, pageX, pageY) => {
          gridLayout.current = { x: pageX, y: pageY, width, height };
          paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        });
      },
      onPanResponderMove: (evt) => {
        paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderRelease: () => { 
        lastPaintedIndex.current = -1; 
      }
    })
  ).current;

  const paint = (pageX: number, pageY: number) => {
    const { x, y, width, height } = gridLayout.current;
    
    // Horizontal offset for the "AM/PM" labels (35px)
    const labelWidth = 35;
    const relX = pageX - x - labelWidth;
    const relY = pageY - y;
    
    const drawableWidth = width - labelWidth;

    // Boundary check
    if (relX < 0 || relX > drawableWidth || relY < 0 || relY > height) return;

    // Determine row (Top half = AM, Bottom half = PM)
    const isSecondRow = relY > (height / 2);
    
    // Determine 30-min slot (24 slots per row)
    const slotWidth = drawableWidth / 24;
    const colIndex = Math.floor(relX / slotWidth);
    const index = isSecondRow ? colIndex + 24 : colIndex;

    // Update if valid and index changed during drag
    if (index >= 0 && index < 48 && index !== lastPaintedIndex.current) {
      setBlocks(prev => {
        // Optimization: don't trigger re-render if color is already correct
        if (prev[index] === activeBrush) return prev;
        const next = [...prev];
        next[index] = activeBrush;
        return next;
      });
      lastPaintedIndex.current = index;
      Vibration.vibrate(8); // Subtle tactile feedback
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Timeline",
      "This will clear all work and watch entries for this day. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => setBlocks(new Array(48).fill(0)) }
      ]
    );
  };

  const getBlockColor = (val: number) => {
    if (val === 1) return "#F59E0B"; // Work
    if (val === 2) return "#3B82F6"; // Watch
    return "#10B981"; // Rest (Default)
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header Navigation Bar */}
        <View style={styles.modalHeader}>
            <IconButton icon="close" onPress={onCancel} />
            <Text variant="titleLarge" style={styles.headerTitle}>Log Activity</Text>
            <Button 
                mode="contained" 
                onPress={() => onSave(blocks)} 
                style={styles.doneBtn}
                labelStyle={{fontWeight: '700'}}
            >
                Done
            </Button>
        </View>

        <View style={styles.content}>
            <Text variant="bodyMedium" style={styles.instruction}>
                Select a tool below, then swipe across the timeline to log your hours.
            </Text>
            
            {/* Brush Selector */}
            <View style={styles.brushContainer}>
                {BRUSHES.map(b => {
                    // Hide "Watch" brush for Engine Cadets
                    if (!isDeckCadet && b.id === 2) return null;

                    const isActive = activeBrush === b.id;
                    const displayColor = b.id === 0 ? "#6B7280" : b.color;

                    return (
                        <TouchableOpacity 
                            key={b.id} 
                            activeOpacity={0.7}
                            style={[
                                styles.brushCard, 
                                isActive && { borderColor: displayColor, backgroundColor: displayColor + '10', elevation: 4 }
                            ]}
                            onPress={() => setActiveBrush(b.id)}
                        >
                            <IconButton 
                                icon={b.icon} 
                                iconColor={isActive ? displayColor : '#9CA3AF'} 
                                size={28}
                            />
                            <RNText style={[styles.brushLabel, { color: isActive ? displayColor : '#6B7280' }]}>
                                {b.label}
                            </RNText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* The Painter Interface */}
            <Surface elevation={1} style={styles.painterSurface}>
                <View ref={gridRef} style={styles.gridContainer} {...panResponder.panHandlers}>
                    <View pointerEvents="none">
                        {[0, 24].map((offset, rowIdx) => (
                            <View key={rowIdx} style={{marginBottom: rowIdx === 0 ? 35 : 0}}>
                                <View style={styles.row}>
                                    <View style={styles.labelCol}>
                                        <RNText style={styles.rowLabel}>{rowIdx === 0 ? 'AM' : 'PM'}</RNText>
                                    </View>
                                    <View style={styles.blocksRow}>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <View 
                                                key={i} 
                                                style={[
                                                    styles.block, 
                                                    { 
                                                        backgroundColor: getBlockColor(blocks[i + offset]), 
                                                        borderRightWidth: i % 2 === 1 ? 1 : 0 
                                                    }
                                                ]} 
                                            />
                                        ))}
                                    </View>
                                </View>
                                {/* Accurate Time Grid Labels */}
                                <View style={styles.timeLabels}>
                                    {[0, 2, 4, 6, 8, 10, 12].map(h => (
                                        <RNText key={h} style={styles.timeText}>
                                            {String(h + (rowIdx * 12)).padStart(2, '0')}
                                        </RNText>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </Surface>

            <Button 
                icon="refresh" 
                mode="text" 
                onPress={handleReset} 
                style={styles.resetBtn}
                textColor="#6B7280"
            >
                Clear Entire Day
            </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 8, 
    height: 64,
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    elevation: 2
  },
  headerTitle: { fontWeight: '900', color: '#111827' },
  doneBtn: { borderRadius: 8, paddingHorizontal: 8 },
  
  content: { padding: 20, flex: 1, alignItems: 'center' },
  instruction: { textAlign: 'center', color: '#6B7280', marginBottom: 30, lineHeight: 20 },
  
  brushContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  brushCard: { 
    width: 95, 
    height: 90, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: 'transparent', 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2 
  },
  brushLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  painterSurface: { padding: 20, borderRadius: 24, backgroundColor: 'white', width: '100%', elevation: 3 },
  gridContainer: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', height: 65 },
  labelCol: { width: 35 },
  rowLabel: { fontSize: 13, fontWeight: '900', color: '#374151' },
  
  blocksRow: { 
    flex: 1, 
    flexDirection: 'row', 
    height: '100%', 
    borderRadius: 10, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: '#D1D5DB' 
  },
  block: { flex: 1, height: '100%', borderColor: '#FFFFFF40' },
  
  timeLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingLeft: 35, 
    marginTop: 10 
  },
  timeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    width: 24, 
    textAlign: 'center', 
    marginLeft: -12 
  },
  resetBtn: { marginTop: 30 }
});