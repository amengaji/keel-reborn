/**
 * ============================================================
 * General Identity & Registry Section
 * ============================================================
 *
 * FIRST Sea Service form.
 * Draft-safe, partial save allowed.
 */

import React, { useState } from "react";
import { View, StyleSheet, Platform, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Divider,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

export default function GeneralIdentitySection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { payload, updateSection } = useSeaService();

  /**
   * Load existing values (resume-safe)
   */
  const existing = payload.sections.GENERAL_IDENTITY ?? {};

  /**
   * Local draft state
   */
  const [shipName, setShipName] = useState(existing.shipName ?? "");
  const [imoNumber, setImoNumber] = useState(existing.imoNumber ?? "");
  const [callSign, setCallSign] = useState(existing.callSign ?? "");
  const [flagState, setFlagState] = useState(existing.flagState ?? "");
  const [portOfRegistry, setPortOfRegistry] = useState(
    existing.portOfRegistry ?? ""
  );

  /**
   * Save handler
   */
  const handleSave = () => {
    updateSection("GENERAL_IDENTITY", {
      shipName,
      imoNumber,
      callSign,
      flagState,
      portOfRegistry,
    });

    toast.success("General Identity details saved.");

    
    /**
     * UX RULE (CRITICAL):
     * - Saving a section returns cadet to Sections overview INSIDE wizard
     * - Do NOT navigate out to Sea Service dashboard
     */
    if (onSaved) {
      onSaved();
    }


  };

return (
  <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    {/* ================= SCROLLABLE FORM ================= */}
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      enableOnAndroid
      extraScrollHeight={80}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.title}>
        General Identity & Registry
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter basic identification details of the vessel.
        You can save and return later.
      </Text>

      <Divider style={styles.divider} />

      <TextInput
        label="Ship Name"
        value={shipName}
        onChangeText={setShipName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="IMO Number"
        value={imoNumber}
        onChangeText={setImoNumber}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Call Sign"
        value={callSign}
        onChangeText={setCallSign}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Flag State"
        value={flagState}
        onChangeText={setFlagState}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Port of Registry"
        value={portOfRegistry}
        onChangeText={setPortOfRegistry}
        mode="outlined"
        style={styles.input}
      />

      {/* Spacer so last field can scroll above bar */}
      <View style={{ height: 96 }} />
    </KeyboardAwareScrollView>

    {/* ================= STICKY SAVE BAR ================= */}
    <View
      style={[
        styles.stickyBar,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outlineVariant,
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
  container: {
    flex: 1,
  },
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
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stickyBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: Platform.OS === "android" ? 12 : 24,
  borderTopWidth: 1,
},

});
