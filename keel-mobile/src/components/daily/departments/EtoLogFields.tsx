//keel-mobile/src/components/daily/departments/EtoLogFields.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { Zap } from "lucide-react-native";
import YesNoCapsule from "../../common/YesNoCapsule";
import CheckboxBox from "../../common/CheckboxBox";

type Props = {
  p1: string; setP1: (t: string) => void;
  p2: string; setP2: (t: string) => void;
  umsStatus: boolean; setUmsStatus: (v: boolean) => void;
};

export default function EtoLogFields({ p1, setP1, p2, setP2, umsStatus, setUmsStatus }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}><Zap size={18} color="#3194A0" /><Text style={styles.title}>ELECTRICAL SYSTEMS</Text></View>
      <TextInput mode="outlined" label="Insulation Resistance (MSB)" value={p1} onChangeText={setP1} placeholder="e.g. >500 MΩ" />
      <View style={styles.capsuleRow}>
        <View style={{ flex: 1 }}><Text style={styles.capsuleLabel}>UMS AUTO-LOG OK?</Text></View>
        <YesNoCapsule value={umsStatus} onChange={setUmsStatus} />
      </View>
      <View style={styles.grid}>
        <View style={styles.checkItem}><CheckboxBox checked={false} onPress={() => {}} /><Text style={styles.checkLabel}>Batteries</Text></View>
        <View style={styles.checkItem}><CheckboxBox checked={false} onPress={() => {}} /><Text style={styles.checkLabel}>Alarms</Text></View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 11, fontWeight: '900', color: "#3194A0" },
  capsuleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(49, 148, 160, 0.05)', padding: 12, borderRadius: 16 },
  capsuleLabel: { fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkLabel: { fontSize: 12, color: '#1E293B', fontWeight: '600' }
});