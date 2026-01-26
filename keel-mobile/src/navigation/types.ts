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
  TaskDetails: { taskKey: string }; // Changed 'taskId' to 'taskKey' to match your screen
};

/**
 * ============================================================
 * MAIN STACK PARAM LIST
 * ============================================================
 * Defines all possible routes in the Root/Inner stacks.
 */
export type MainStackParamList = {
  // Main Shell (Tabs)
  MainTabs: undefined;
  MainShell: undefined; // Internal tab shell

  // Wizards / Modals
  StartSeaService: undefined;
  SeaServiceWizard: undefined;

  // Feature: Vessel Info
  VesselParticulars: undefined;

  // Feature: Tasks (TRB)
  Tasks: undefined;
  TaskSection: { sectionId: string; title: string };
  TaskDetails: { taskId: string };

  // Feature: Daily Logs / Watchkeeping
  Daily: undefined;
  DataSync: undefined;
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
  LogPosition: undefined;
  SafetyMap: undefined;
  SeaService: undefined;
};