//keel-mobile/src/navigation/MainNavigator.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";

import BottomTabNavigator from "./BottomTabNavigator";
import AppHeader from "../components/layout/AppHeader";

// ✅ KEPT: Wizard is distinct from the dashboard
import SeaServiceWizardScreen from "../screens/sea-service/SeaServiceWizardScreen";
import DataSyncScreen from "../screens/DataSyncScreen";

// ✅ KEPT: Tasks & Daily
import TaskSectionScreen from "../screens/tasks/TaskSectionScreen";
import TaskDetailsScreen from "../screens/tasks/TaskDetailsScreen";
import DailyScreen from "../screens/daily/DailyScreen";

// ✅ NEW: Safety Map is now accessed directly from Sea Service Dashboard
import SafetyMapScreen from "../screens/vessel/SafetyMapScreen";
import TaskListScreen from "../screens/tasks/TaskListScreen";

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
 */
export default function MainNavigator() {
  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName="DataSync"
    >
      {/* ======================================================
          INITIALIZATION
         ====================================================== */}
      <RootStack.Screen name="DataSync" component={DataSyncScreen} />

      {/* ======================================================
          MAIN APPLICATION SHELL
         ====================================================== */}
      <RootStack.Screen name="MainTabs" component={MainLayout} />

      {/* ======================================================
          FULL-SCREEN MODALS / WIZARDS
         ====================================================== */}
      <RootStack.Screen
        name="SeaServiceWizard"
        component={SeaServiceWizardScreen}
      />
      {/* Note: 'StartSeaService' is removed as it's now an inline modal */}

    </RootStack.Navigator>
  );
}

/**
 * ============================================================
 * MainLayout
 * ============================================================
 *
 * Defines the persistent app shell with Header + Inner Stack.
 */
function MainLayout() {
  return (
    <View style={styles.container}>
      {/* GLOBAL APP HEADER */}
      <AppHeader />

      <View style={styles.content}>
        <InnerStack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* Bottom Tabs (Home, Sea Service, Tasks, Daily, Profile) */}
          <InnerStack.Screen
            name="MainShell"
            component={BottomTabNavigator}
          />

          {/* Task Drill-Downs */}
          <InnerStack.Screen name="TaskSection" component={TaskSectionScreen} />
          {/* ✅ ADDED: THIS WAS MISSING */}
          <InnerStack.Screen 
            name="TaskList" 
            component={TaskListScreen} 
            options={{ animation: "slide_from_right" }}
          />
          <InnerStack.Screen 
            name="TaskDetails" 
            component={TaskDetailsScreen as any} 
          />

          {/* Operational Screens */}
          <InnerStack.Screen name="Daily" component={DailyScreen} />
          
          {/* Safety Map (Drill down from Sea Service Dashboard) */}
          <InnerStack.Screen 
            name="SafetyMap" 
            component={SafetyMapScreen} 
            options={{ animation: "fade_from_bottom" }}
          />

          {/* Note: 'VesselParticulars' is removed as it's merged into SeaService */}

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