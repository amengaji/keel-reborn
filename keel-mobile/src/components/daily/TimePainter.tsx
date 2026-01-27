//keel-mobile/src/components/daily/TimePainter.tsx

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { TimePainterModal } from "./TimePainterModal";

interface Props {
  activityData: number[]; 
  onChange: (newData: number[], stats: { rest: number; work: number; watch: number }) => void;
  isDeckCadet?: boolean; // ✅ Added back to interface
}

export const TimePainter = ({ activityData, onChange, isDeckCadet = true }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getBlockColor = (val: number) => {
    if (val === 1) return "#F59E0B"; // Work
    if (val === 2) return "#3B82F6"; // Watch
    return "#10B981"; // Rest
  };

  const handleSave = (newData: number[]) => {
    let rest = 0, work = 0, watch = 0;
    newData.forEach(b => {
      if (b === 0) rest += 0.5;
      if (b === 1) work += 0.5;
      if (b === 2) watch += 0.5;
    });
    onChange(newData, { rest, work, watch });
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Surface style={styles.previewCard} elevation={1}>
           <View style={styles.header}>
             <Text variant="titleSmall" style={{fontWeight: '700'}}>24-Hour Timeline</Text>
             <IconButton icon="pencil-outline" size={20} />
           </View>
           
           <View style={styles.miniGrid}>
              {activityData.map((val, i) => (
                <View key={i} style={[styles.miniBlock, { backgroundColor: getBlockColor(val) }]} />
              ))}
           </View>
           
           <Text variant="bodySmall" style={styles.hint}>Tap to edit activity timeline</Text>
        </Surface>
      </TouchableOpacity>

      <TimePainterModal 
        visible={modalVisible} 
        initialData={activityData} 
        onSave={handleSave} 
        onCancel={() => setModalVisible(false)}
        isDeckCadet={isDeckCadet} // ✅ Pass it down to the modal
      />
    </View>
  );
};

const styles = StyleSheet.create({
  previewCard: { padding: 16, borderRadius: 12, backgroundColor: 'white', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  miniGrid: { flexDirection: 'row', height: 30, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  miniBlock: { flex: 1, height: '100%' },
  hint: { textAlign: 'center', color: '#9CA3AF', marginTop: 12, fontStyle: 'italic' }
});