/**
 * ============================================================
 * Dimensions & Tonnages Section
 * ============================================================
 *
 * Captures principal dimensions and tonnage particulars.
 *
 * RULES:
 * - Partial save allowed
 * - Completed status handled in SeaServiceWizard.tsx
 * - Sticky Save bar (UX consistency)
 * - Keyboard + Android system-nav safe
 */

import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

export default function DimensionsTonnageSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const { payload, updateSection } = useSeaService();

  /**
   * Load existing saved values (resume-safe)
   */
  const existing =
    payload.sections.DIMENSIONS_TONNAGE ?? {};

  /**
   * Local editable state
   * NOTE:
   * - Stored as strings for typing comfort
   * - Validation/conversion can be added later
   */
  const [grossTonnage, setGrossTonnage] = useState(
    existing.grossTonnage ?? ""
  );
  const [netTonnage, setNetTonnage] = useState(
    existing.netTonnage ?? ""
  );
  const [deadweightTonnage, setDeadweightTonnage] = useState(
    existing.deadweightTonnage ?? ""
  );
  const [loaMeters, setLoaMeters] = useState(
    existing.loaMeters ?? ""
  );
  const [breadthMeters, setBreadthMeters] = useState(
    existing.breadthMeters ?? ""
  );
  const [summerDraftMeters, setSummerDraftMeters] = useState(
    existing.summerDraftMeters ?? ""
  );

  /**
   * Save handler (draft-safe)
   */
  const handleSave = () => {
    updateSection("DIMENSIONS_TONNAGE", {
      grossTonnage,
      netTonnage,
      deadweightTonnage,
      loaMeters,
      breadthMeters,
      summerDraftMeters,
    });

    toast.success("Dimensions & Tonnages saved.");
    
  /**
   * ============================================================
   * UX RULE (GLOBAL – ALREADY APPROVED):
   * After saving a section, ALWAYS return to Sections overview
   * ============================================================
   */
  if (onSaved) {
    onSaved();
  }
  };

return (
  <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    {/* ================= SCROLLABLE CONTENT ================= */}
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Platform.OS === "android" ? 96 : 80,
        },
      ]}
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Dimensions & Tonnages
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter key tonnage and dimensional particulars. You can save
        even if incomplete.
      </Text>

      <Divider style={styles.divider} />

      <TextInput
        label="Gross Tonnage (GT)"
        value={grossTonnage}
        onChangeText={setGrossTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Net Tonnage (NT)"
        value={netTonnage}
        onChangeText={setNetTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Deadweight Tonnage (DWT)"
        value={deadweightTonnage}
        onChangeText={setDeadweightTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <Divider style={styles.divider} />

      <TextInput
        label="Length Overall (LOA) (m)"
        value={loaMeters}
        onChangeText={setLoaMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Breadth (m)"
        value={breadthMeters}
        onChangeText={setBreadthMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Summer Draft (m)"
        value={summerDraftMeters}
        onChangeText={setSummerDraftMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />
    </KeyboardAwareScrollView>

    {/* ================= STICKY SAVE BAR ================= */}
    <View
      style={[
        styles.bottomBar,
        {
          paddingBottom: Platform.OS === "android" ? 12 : 8,
        },
      ]}
    >
      <Button mode="contained" onPress={handleSave}>
        Save Section
      </Button>
    </View>
  </View>
);

}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    padding: 16,
  },

  title: {
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },

  divider: {
    marginVertical: 12,
  },

  input: {
    marginBottom: 12,
  },

  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
});
