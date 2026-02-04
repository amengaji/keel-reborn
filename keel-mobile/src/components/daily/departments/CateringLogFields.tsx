//keel-mobile/src/components/daily/departments/CateringLogFields.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { Coffee, Thermometer } from "lucide-react-native";
import YesNoCapsule from "../../common/YesNoCapsule";

type Props = {
  p1: string; setP1: (t: string) => void;
  p2: string; setP2: (t: string) => void;
  hygieneCheck: boolean; setHygieneCheck: (v: boolean) => void;
};

export default function CateringLogFields({ p1, setP1, p2, setP2, hygieneCheck, setHygieneCheck }: Props) {
  const theme = useTheme();
  const primaryBrand = "#3194A0";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Coffee size={18} color={primaryBrand} />
        <Text style={styles.title}>GALLEY & PROVISION LOG</Text>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>COLD STORAGE TEMPERATURES</Text>
        <TextInput
          mode="outlined"
          value={p1}
          onChangeText={setP1}
          placeholder="e.g. Meat: -18C, Veg: +4C"
          outlineColor={theme.colors.outlineVariant}
          activeOutlineColor={primaryBrand}
          style={styles.input}
          left={<TextInput.Icon icon={() => <Thermometer size={18} color="#94A3B8" />} />}
        />
      </View>

      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>DAILY HYGIENE INSPECTION DONE?</Text>
        <YesNoCapsule value={hygieneCheck} onChange={setHygieneCheck} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 12, fontWeight: '900', color: "#3194A0", letterSpacing: 1 },
  inputWrap: { flex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
  input: { backgroundColor: 'transparent', height: 45 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  controlLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' }
});