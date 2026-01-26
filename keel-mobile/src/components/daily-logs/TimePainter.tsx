// keel-mobile/src/components/daily-logs/TimePainter.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');
const TOTAL_SLOTS = 48; // 24 hours * 2 (30 min slots)
const SLOT_WIDTH = (width - 60) / 24; // Adjust based on padding

interface Props {
  initialData?: Record<string, string>; // { "00:00": "REST", ... }
  onChange: (data: Record<string, string>) => void;
  mode: 'WORK' | 'REST';
}

export default function TimePainter({ initialData, onChange, mode }: Props) {
  const theme = useTheme();
  // State: Array of 48 booleans (True = Work, False = Rest) for performance
  const [slots, setSlots] = useState<boolean[]>(Array(TOTAL_SLOTS).fill(false));

  useEffect(() => {
    // Parse initial data if exists
    if (initialData) {
       // Logic to convert JSON time keys to boolean array
       // (Skipped for brevity, defaulting to all Rest)
    }
  }, []);

    // Handle "Painting" logic
    // Replace the toggleSlot function in TimePainter.tsx with this:

    const toggleSlot = (index: number) => {
        const newSlots = [...slots];
        // Set slot to TRUE (Work) if mode is WORK, else FALSE (Rest)
        const isWork = mode === 'WORK';
        
        // Toggle behavior: Only apply if it's different, or just paint over?
        // "Paint" behavior typically means forcing the value.
        newSlots[index] = isWork; 
        
        setSlots(newSlots);
        
        // Prepare Data for Parent
        // Format: { "00:00": "WORK", "00:30": "REST", ... }
        const exportData: Record<string, string> = {};
        newSlots.forEach((val, idx) => {
            // Calculate time label
            const hour = Math.floor(idx / 2).toString().padStart(2, '0');
            const min = (idx % 2 === 0) ? "00" : "30";
            const timeKey = `${hour}:${min}`;
            exportData[timeKey] = val ? "WORK" : "REST";
        });
        
        onChange(exportData);
    };

  // Pan Responder for Dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
       // Calculate which slot index is being touched based on X coordinate
       const x = evt.nativeEvent.locationX;
       const index = Math.floor(x / SLOT_WIDTH);
       if (index >= 0 && index < TOTAL_SLOTS) {
           toggleSlot(index);
       }
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
         <Text variant="labelSmall">00</Text>
         <Text variant="labelSmall">06</Text>
         <Text variant="labelSmall">12</Text>
         <Text variant="labelSmall">18</Text>
         <Text variant="labelSmall">24</Text>
      </View>
      
      <View 
        style={styles.trackContainer} 
        {...panResponder.panHandlers}
      >
        {slots.map((isWork, index) => (
            <View 
               key={index} 
               style={[
                   styles.slot, 
                   { 
                     backgroundColor: isWork ? '#EF4444' : '#10B981', // Red=Work, Green=Rest
                     width: `${100/48}%` 
                   }
               ]} 
            />
        ))}
      </View>

      <Text style={styles.hint}>Drag across the bar to paint {mode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, marginBottom: 5 },
  trackContainer: { 
      height: 60, 
      flexDirection: 'row', 
      borderRadius: 12, 
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)'
  },
  slot: { height: '100%', borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.1)' },
  hint: { textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9CA3AF' }
});