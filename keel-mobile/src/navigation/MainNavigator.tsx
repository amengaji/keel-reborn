//keel-mobile/src/navigation/MainNavigator.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";

import BottomTabNavigator from "./BottomTabNavigator";
import AppHeader from "../components/layout/AppHeader";

/**
 * Screens that MUST be full-screen (NO AppHeader, NO Tabs)
 */
// ✅ FIXED: Updated Path
import SeaServiceWizardScreen from "../screens/sea-service/SeaServiceWizardScreen";
// ✅ FIXED: Updated Path
import StartSeaServiceScreen from "../screens/sea-service/StartSeaServiceScreen";
import DataSyncScreen from "../screens/DataSyncScreen";

/**
 * Feature Screens (Tasks, Daily Logs, Vessel Info)
 * These screens usually require the AppHeader context
 */
// ✅ FIXED: Updated Path
import {VesselParticularsScreen} from "../screens/vessel/VesselParticularsScreen";
// ✅ FIXED: Updated Path
import TaskSectionScreen from "../screens/tasks/TaskSectionScreen";
// ✅ FIXED: Updated Path
import TaskDetailsScreen from "../screens/tasks/TaskDetailsScreen";
// ✅ FIXED: Updated Path
import DailyScreen from "../screens/daily/DailyScreen";

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
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName="DataSync"
    >
      {/* ======================================================
          INITIALIZATION
          ------------------------------------------------------
          - Data Sync / Loading Screen
         ====================================================== */}
      <RootStack.Screen name="DataSync" component={DataSyncScreen} />

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
 * - VesselParticulars lives here
 * - This guarantees:
 * ✓ Header visibility
 * ✓ Tab visibility (if configured)
 * ✓ Correct stacking
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
          - Vessel Info & Daily Logs
         ====================================================== */}
      <View style={styles.content}>
        <InnerStack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* Bottom Tabs */}
          <InnerStack.Screen
            name="MainShell"
            component={BottomTabNavigator}
          />

          {/* Task Drill-Downs 
             (Keep Header & Tabs visible) 
          */}
          <InnerStack.Screen name="TaskSection" component={TaskSectionScreen} />
          
          {/* FIX: Cast to 'any' to resolve Type mismatch between 
             Local Screen Props vs Global Navigator Props. 
             They are structurally identical ({taskKey: string}).
          */}
          <InnerStack.Screen 
            name="TaskDetails" 
            component={TaskDetailsScreen as any} 
          />

          {/* Operational Screens 
             (Moved here to ensure they get the App Header)
          */}
          <InnerStack.Screen 
            name="VesselParticulars" 
            component={VesselParticularsScreen} 
            options={{ animation: "slide_from_right" }}
          />
          
          <InnerStack.Screen name="Daily" component={DailyScreen} />

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