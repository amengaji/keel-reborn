//keel-mobile/src/navigation/types.ts

/**
 * ============================================================
 * Navigation Type Definitions
 * ============================================================
 *
 * IMPORTANT RULES:
 * - Stack param lists MUST match actual navigator usage
 * - A screen belongs to EXACTLY ONE stack
 * - Types must reflect real navigation hierarchy
 */

/* ------------------------------------------------------------
 * AUTH FLOW
 * ------------------------------------------------------------ */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  EnableBiometrics: undefined;
};

/* ------------------------------------------------------------
 * MAIN STACK (above Bottom Tabs)
 * ------------------------------------------------------------ */
export type MainStackParamList = {
  MainTabs: undefined;
  StartSeaService: undefined;

  /**
   * Inner shell content
   * - BottomTabNavigator
   * - Task / Daily / Profile flows
   *
   * NOTE:
   * Must be distinct from MainTabs to avoid nested-name warning.
   */
  MainShell: undefined;

  /**
   * Full-screen Sea Service Wizard
   * - Opened from Sea Service dashboard
   */
  SeaServiceWizard: undefined;

  /**
   * Task Details (drill-down screen)
   * - Opened from Tasks tab list
   * - Inspector-safe: explicit id
   */
};

/* ------------------------------------------------------------
 * BOTTOM TABS
 * ------------------------------------------------------------ */
export type BottomTabParamList = {
  Home: undefined;
  SeaService: undefined;
  Daily: undefined;
  Tasks: undefined;
  Profile: undefined;
  Settings: undefined;
};

/**
 * ============================================================
 * Tasks Stack (inside Tasks Tab)
 * ============================================================
 */
export type TasksStackParamList = {
  TasksHome: undefined;

  TaskSection: {
    sectionKey: string;
    sectionTitle: string;
  };

  TaskDetails: {
    taskKey: string;
  };
};

