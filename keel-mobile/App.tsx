//keel-mobile/App.tsx

import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { keelLightTheme, keelDarkTheme } from "./src/theme/keelTheme";
import { initDatabase } from "./src/db/database";
import { ToastProvider } from "./src/components/toast/ToastProvider";
import { ensureSeedTasksExist } from "./src/db/tasks";

/**
 * ============================================================
 * Themed Application Wrapper
 * ============================================================
 *
 * Responsibilities:
 * - Apply light / dark theme
 * - Initialize SQLite database
 * - Mount navigation
 * - Mount global ToastProvider
 */

function ThemedApp() {
  const { themeMode } = useAuth();

  const theme =
    themeMode === "dark" ? keelDarkTheme : keelLightTheme;

  /**
   * Initialize SQLite database once on app start.
   */
  useEffect(() => {
    try {
      initDatabase();
      ensureSeedTasksExist(); // ✅ THIS IS MISSING
      console.log("SQLite database initialized");
    } catch (err) {
      console.error("SQLite init error", err);
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      {/* 
        Global Toast Provider
        ---------------------
        - Snackbar-based
        - Theme-aware
        - Used across entire app
      */}
      <ToastProvider>
        {/* App navigation */}
        <AppNavigator />
      </ToastProvider>
    </PaperProvider>
  );
}

/**
 * ============================================================
 * Root App Component
 * ============================================================
 *
 * AuthProvider must remain the outermost provider
 * so authentication state is available everywhere.
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  );
}
