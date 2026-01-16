//keel-mobile/src/screens/SeaServiceWizardScreen.tsx

/**
 * ============================================================
 * Sea Service Wizard Screen (Full Screen)
 * ============================================================
 *
 * This is a full-screen wrapper for the Sea Service wizard.
 *
 * RESPONSIBILITIES:
 * - Provides its own header + back button
 * - Mounts SeaServiceProvider
 * - Renders SeaServiceWizard
 *
 * NOTE:
 * - No SQLite persistence yet (added later)
 * - This screen is opened from SeaServiceScreen Dashboard
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import SeaServiceWizard from "../sea-service/SeaServiceWizard";
import { useToast } from "../components/toast/useToast";

export default function SeaServiceWizardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const toast = useToast();

  /**
   * Back handler:
   * - Later we will warn about unsaved changes (if needed)
   * - For now: simple goBack()
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Full-screen header (independent of AppHeader) */}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="Add Sea Service" />
        <Appbar.Action
          icon="information-outline"
          onPress={() => toast.info("Wizard draft auto-saves. You can return anytime.")}
        />
      </Appbar.Header>

      {/* Wizard + Provider */}
      <View style={styles.content}>
          <SeaServiceWizard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
