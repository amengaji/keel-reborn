//keel-mobile/src/navigation/MainNavigator.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";

import BottomTabNavigator from "./BottomTabNavigator";
import AppHeader from "../components/layout/AppHeader";

/**
 * Screens that MUST be full-screen (NO AppHeader, NO Tabs)
 */
import SeaServiceWizardScreen from "../screens/SeaServiceWizardScreen";
import StartSeaServiceScreen from "../screens/StartSeaServiceScreen";


const RootStack = createNativeStackNavigator<MainStackParamList>();
const InnerStack = createNativeStackNavigator<MainStackParamList>();

/**
 * ============================================================
 * MainNavigator (ROOT)
 * ============================================================
 *
 * ARCHITECTURAL RULES (LOCKED):
 * ------------------------------------------------------------
 * 1. AppHeader is part of the MAIN SHELL
 * 2. Bottom Tabs are always visible for task navigation
 * 3. SeaServiceWizard is immersive (no header, no tabs)
 *
 * This file intentionally separates:
 * - ROOT stack (modal / immersive flows)
 * - INNER stack (normal app navigation)
 *
 * This prevents:
 * ❌ Header duplication
 * ❌ Safe-area hacks
 * ❌ Layout regressions
 */
export default function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* ======================================================
          MAIN APPLICATION SHELL
          ------------------------------------------------------
          Includes:
          - AppHeader (persistent)
          - Bottom Tabs
          - Task drill-down screens
         ====================================================== */}
      <RootStack.Screen name="MainTabs" component={MainLayout} />

      {/* ======================================================
          FULL-SCREEN MODALS / WIZARDS
          ------------------------------------------------------
          These intentionally DO NOT show AppHeader or Tabs
         ====================================================== */}
      <RootStack.Screen
        name="StartSeaService"
        component={StartSeaServiceScreen}
        options={{ presentation: "modal" }}
      />

      <RootStack.Screen
        name="SeaServiceWizard"
        component={SeaServiceWizardScreen}
      />
    </RootStack.Navigator>
  );
}

/**
 * ============================================================
 * MainLayout
 * ============================================================
 *
 * This component defines the persistent app shell:
 * - AppHeader (always visible)
 * - InnerStack rendered below header
 *
 * IMPORTANT:
 * - TaskSection & TaskDetails live here
 * - This guarantees:
 *   ✓ Header visibility
 *   ✓ Tab visibility
 *   ✓ Correct stacking
 */
function MainLayout() {
  return (
    <View style={styles.container}>
      {/* ======================================================
          GLOBAL APP HEADER
          ------------------------------------------------------
          - Always visible
          - Contextual ⓘ icon injected per screen
         ====================================================== */}
      <AppHeader />

      {/* ======================================================
          INNER STACK
          ------------------------------------------------------
          - Bottom Tabs (default)
          - TaskSection
          - TaskDetails
         ====================================================== */}
      <View style={styles.content}>
        <InnerStack.Navigator screenOptions={{ headerShown: false }}>
          {/* Bottom Tabs */}
          <InnerStack.Screen
            name="MainShell"
            component={BottomTabNavigator}
          />


        </InnerStack.Navigator>
      </View>
    </View>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
