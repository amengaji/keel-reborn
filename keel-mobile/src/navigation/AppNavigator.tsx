//keel-mobile/src/navigation/AppNavigator.tsx

/**
 * ============================================================
 * AppNavigator — Root Navigation Container
 * ============================================================
 *
 * IMPORTANT:
 * - This is the ROOT of the app navigation tree.
 * - All global providers that must be available app-wide
 *   MUST be mounted here (contexts, theming, etc).
 *
 * WHY providers live here:
 * - Home dashboard is an inspector-style snapshot screen.
 * - It must read real compliance signals (Sea Service, Daily Logs).
 * - Wizards / screens that write data must share the same instances.
 *
 * NO BUSINESS LOGIC is changed in this file.
 * Existing auth / onboarding / biometric flows remain unchanged.
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import EnableBiometricsScreen from "../screens/EnableBiometricsScreen";
import OnboardingNavigator from "./OnboardingNavigator";

/**
 * ============================================================
 * Global Domain Providers
 * ============================================================
 *
 * Rule:
 * - Screens should NOT directly import DB helpers.
 * - Screens should read data through Context Providers.
 *
 * Mounted here so the same provider instance is available to:
 * - Home dashboard (read-only snapshot)
 * - Daily / Sea Service screens (edit/write flows)
 */

// ✅ Sea Service: Home reads Sea Service compliance; Wizard writes it
import { SeaServiceProvider } from "../sea-service/SeaServiceContext";

// ✅ Daily Logs: Home reads last log date / health; Daily screen writes logs
import { DailyLogsProvider } from "../daily-logs/DailyLogsContext";

export default function AppNavigator() {
  const { user, loading, biometricPromptSeen, onboardingCompleted } = useAuth();

  /**
   * Preserve existing loading behavior exactly.
   * We do not show navigation until auth state is ready.
   */
  if (loading) return null;

  return (
    /**
     * Provider Order Notes (important for beginners):
     * - Both providers are independent and safe to nest.
     * - We keep them at the root so Home can access both.
     * - If a provider is missing, screens using its hook will throw.
     */
    <SeaServiceProvider>
      <DailyLogsProvider>
        <NavigationContainer>
          {/* --------------------------------------------------------
              AUTH FLOW (unchanged)
             -------------------------------------------------------- */}
          {!user && <AuthNavigator />}

          {/* --------------------------------------------------------
              BIOMETRIC PROMPT (unchanged)
             -------------------------------------------------------- */}
          {user && !biometricPromptSeen && <EnableBiometricsScreen />}

          {/* --------------------------------------------------------
              ONBOARDING FLOW (unchanged)
             -------------------------------------------------------- */}
          {user && biometricPromptSeen && !onboardingCompleted && (
            <OnboardingNavigator />
          )}

          {/* --------------------------------------------------------
              MAIN APPLICATION (unchanged)
             -------------------------------------------------------- */}
          {user && biometricPromptSeen && onboardingCompleted && <MainNavigator />}
        </NavigationContainer>
      </DailyLogsProvider>
    </SeaServiceProvider>
  );
}
