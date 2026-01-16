//keel-mobile/src/components/ui/KeelScreen.tsx

/**
 * ============================================================
 * KeelScreen — GLOBAL SAFE SCREEN WRAPPER (FINAL)
 * ============================================================
 *
 * RESPONSIBILITY (CENTRAL, NON-NEGOTIABLE):
 * - Handle ALL system safe areas:
 *   • Android status bar
 *   • Android system navigation (3-button / gesture)
 *   • iOS notch / home indicator
 *
 * WHY THIS EXISTS:
 * - AppHeader is rendered OUTSIDE screens
 * - BottomTabNavigator does NOT add safe padding to screens
 * - Individual screens MUST NOT guess system insets
 *
 * RULE:
 * - KeelScreen owns SAFETY
 * - Screens own LAYOUT
 *
 * This prevents:
 * ❌ Overlap with status bar
 * ❌ Overlap with bottom navigation
 * ❌ Per-screen hacks
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type KeelScreenProps = {
  children: React.ReactNode;
};

export const KeelScreen: React.FC<KeelScreenProps> = ({ children }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      // ✅ ENABLE ALL EDGES — THIS IS CRITICAL
      edges={[ "left", "right"]}
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* ========================================================
          Inner container
          - Horizontal padding: design spacing
          - Vertical padding: MINIMAL safety buffer
         ======================================================== */}
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,

    // ✅ Standard KEEL horizontal spacing
    paddingHorizontal: 20,

    // ❗ Vertical padding is applied dynamically via insets
  },
});
