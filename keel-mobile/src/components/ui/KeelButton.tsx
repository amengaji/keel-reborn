//keel-mobile/src/components/ui/KeelButton.tsx

/**
 * ============================================================
 * KeelButton — Themed Action Button (PSC / Dark-Mode Safe)
 * ============================================================
 *
 * PURPOSE:
 * - Single source of truth for all buttons in KEEL
 * - Enforces brand primary color (#3194A0)
 * - Works correctly in BOTH light & dark mode
 * - Supports icons (required for guidance, actions, affordances)
 *
 * IMPORTANT RULES:
 * - NEVER hardcode colors at screen level
 * - All buttons must go through KeelButton
 * - react-native-paper theme is the authority
 */

import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Button, useTheme } from "react-native-paper";

/**
 * ============================================================
 * Button Modes (Semantic, NOT visual-only)
 * ============================================================
 *
 * primary   → main call-to-action (contained)
 * secondary → secondary emphasis (outlined)
 * outline   → neutral / tertiary action (outlined, subtle)
 */
export type KeelButtonMode = "primary" | "secondary" | "outline";

/**
 * ============================================================
 * Props
 * ============================================================
 */
export type KeelButtonProps = {
  /** Button label */
  children: React.ReactNode;

  /** Semantic button mode */
  mode?: KeelButtonMode;

  /** Optional icon (MaterialCommunityIcons name) */
  icon?: string;

  /** Loading spinner */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Press handler */
  onPress: () => void;

  /** Optional style override (rarely needed) */
  style?: StyleProp<ViewStyle>;
};

/**
 * ============================================================
 * Component
 * ============================================================
 */
export const KeelButton: React.FC<KeelButtonProps> = ({
  children,
  mode = "primary",
  icon,
  loading = false,
  disabled = false,
  onPress,
  style,
}) => {
  const theme = useTheme();

  /**
   * ============================================================
   * Visual mapping based on semantic mode
   * ============================================================
   *
   * NOTE:
   * - We intentionally rely on theme.colors.primary
   * - This guarantees consistency across light/dark mode
   */
  let paperMode: "contained" | "outlined" = "contained";
  let buttonColor: string | undefined = undefined;
  let textColor: string | undefined = undefined;
  let borderColor: string | undefined = undefined;

  switch (mode) {
    case "primary":
      paperMode = "contained";
      buttonColor = theme.colors.primary;
      textColor = theme.colors.onPrimary;
      break;

    case "secondary":
      paperMode = "outlined";
      buttonColor = undefined;
      textColor = theme.colors.primary;
      borderColor = theme.colors.primary;
      break;

    case "outline":
      paperMode = "outlined";
      buttonColor = undefined;
      textColor = theme.colors.onSurface;
      borderColor = theme.colors.outline;
      break;
  }

  return (
    <Button
      mode={paperMode}
      icon={icon}                       // ✅ ICON SUPPORT FIXED
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[
        {
          borderRadius: 10,
          borderWidth: paperMode === "outlined" ? 1.5 : 0,
          borderColor,
          paddingVertical: 4,
        },
        style,
      ]}
      labelStyle={{
        fontWeight: "600",
        fontSize: 16,
      }}
      contentStyle={{
        paddingHorizontal: 12,
      }}
    >
      {children}
    </Button>
  );
};
