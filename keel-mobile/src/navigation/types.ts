//keel-mobile/src/navigation/types.ts

import { NavigatorScreenParams } from "@react-navigation/native";

/**
 * ============================================================
 * TASKS STACK PARAM LIST
 * ============================================================
 * Defines routes strictly for the Task/TRB Tab.
 */
export type TasksStackParamList = {
  TasksHome: undefined;
  TaskSection: { sectionKey: string; sectionTitle: string };
  TaskDetails: { taskKey: string };
};

/**
 * ============================================================
 * MAIN STACK PARAM LIST
 * ============================================================
 * Defines all possible routes in the Root/Inner stacks.
 */
export type MainStackParamList = {
  // Initialization
  DataSync: undefined;

  // Main Shell (Tabs)
  MainTabs: undefined;
  MainShell: undefined; // Internal tab shell

  // Wizards / Modals
  SeaServiceWizard: undefined;

  // Feature: Tasks (TRB)
  // We align these params with TasksStackParamList for consistency
  Tasks: NavigatorScreenParams<TasksStackParamList>;
  TaskSection: { sectionKey: string; sectionTitle: string };
  TaskDetails: { taskKey: string };

  // Feature: Daily Logs / Watchkeeping
  Daily: undefined;

  // Feature: Vessel Dashboard Drill-down
  SafetyMap: undefined;
};

/**
 * ============================================================
 * AUTH STACK PARAM LIST
 * ============================================================
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

/**
 * ============================================================
 * ONBOARDING STACK PARAM LIST
 * ============================================================
 */
export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  EnableBiometrics: undefined; 
  VesselStatus: undefined;
  VesselDetails: undefined; 
  // Note: SafetyMap & SeaService moved to MainStack as they are core features now
};