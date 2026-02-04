//keel-mobile/src/components/daily/departments/DeckLogFields.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Divider } from "react-native-paper";
import { MapPin, Compass } from "lucide-react-native";
import YesNoCapsule from "../../common/YesNoCapsule";
import CheckboxBox from "../../common/CheckboxBox";

type Props = {
  p1: string; setP1: (t: string) => void;
  p2: string; setP2: (t: string) => void;
  onGps: () => void;
  isLookout: boolean; setIsLookout: (v: boolean) => void;
};

export default function DeckLogFields({ p1, setP1, p2, setP2, onGps, isLookout, setIsLookout }: Props) {
  const primaryBrand = "#3194A0";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Compass size={18} color={primaryBrand} />
        <Text style={styles.title}>NAVIGATION & POSITION</Text>
      </View>

      <View style={styles.row}>
        <TextInput mode="outlined" label="Latitude" value={p1} onChangeText={setP1} style={styles.flex} right={<TextInput.Icon icon={() => <MapPin size={20} color={primaryBrand} />} onPress={onGps} />} />
        <TextInput mode="outlined" label="Longitude" value={p2} onChangeText={setP2} style={styles.flex} />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.capsuleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.capsuleLabel}>PERFORMED LOOKOUT DUTY?</Text>
          <Text style={styles.capsuleSub}>Hours of darkness requirement</Text>
        </View>
        <YesNoCapsule value={isLookout} onChange={setIsLookout} />
      </View>

      <Text style={styles.gridLabel}>OPERATIONAL STATUS:</Text>
      <View style={styles.grid}>
        <View style={styles.checkItem}>
          <CheckboxBox checked={true} onPress={() => {}} />
          <Text style={styles.checkLabel}>Bridge Watch</Text>
        </View>
        <View style={styles.checkItem}>
          <CheckboxBox checked={false} onPress={() => {}} />
          <Text style={styles.checkLabel}>Cargo Ops</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 11, fontWeight: '900', color: "#3194A0", letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  divider: { marginVertical: 8, opacity: 0.3 },
  capsuleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(49, 148, 160, 0.05)', padding: 12, borderRadius: 16 },
  capsuleLabel: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  capsuleSub: { fontSize: 10, color: '#64748B' },
  gridLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkLabel: { fontSize: 12, color: '#1E293B', fontWeight: '600' }
});