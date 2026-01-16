//keel-mobile/src/components/layout/AppHeader.tsx

import React from "react";
import { Alert } from "react-native";
import { Appbar } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";

/**
 * ============================================================
 * AppHeader — Global Header (Context-Aware)
 * ============================================================
 *
 * RESPONSIBILITY:
 * - Always visible header
 * - Optional right-side contextual action (ⓘ)
 * - NO route logic here
 *
 * WHY:
 * - Keeps header reusable
 * - Allows MainNavigator to decide when ⓘ is shown
 */

interface AppHeaderProps {
  title?: string;

  /**
   * Optional contextual action (e.g. ⓘ for TaskDetails)
   */
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export default function AppHeader({
  title = "KEEL",
  rightAction,
}: AppHeaderProps) {
  const { themeMode, toggleTheme } = useAuth();

  const handleNotifications = () => {
    Alert.alert("Notifications", "Coming soon");
  };

  const handleToggleTheme = async () => {
    await toggleTheme();
  };

  return (
    <Appbar.Header elevated>
      <Appbar.Content title={title} />

      {/* ⓘ Contextual Action (ONLY when provided) */}
      {rightAction && (
        <Appbar.Action
          icon={rightAction.icon}
          onPress={rightAction.onPress}
        />
      )}

      {/* Theme Toggle */}
      <Appbar.Action
        icon={themeMode === "dark" ? "weather-sunny" : "moon-waning-crescent"}
        onPress={handleToggleTheme}
      />

      {/* Notifications */}
      <Appbar.Action
        icon="bell-outline"
        onPress={handleNotifications}
      />
    </Appbar.Header>
  );
}
