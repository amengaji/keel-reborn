//keel-mobile/src/components/ui/KeelCard.tsx

/**
 * ============================================================
 * KeelCard — Themed Container (MD3 / Dark-Mode Safe)
 * ============================================================
 *
 * PURPOSE:
 * - Standard card container across KEEL
 * - Used for:
 *   • Task cards
 *   • Section cards
 *   • Summary cards
 *   • Future pressable cards
 *
 * DESIGN RULES:
 * - MUST respect react-native-paper theme
 * - MUST look correct in light & dark mode
 * - MUST avoid hard elevation in dark mode
 * - MUST be audit / inspector friendly
 *
 * IMPORTANT:
 * - No hardcoded colors
 * - No screen-level styling hacks
 */

import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Card, useTheme } from "react-native-paper";

type KeelCardProps = {
  /** Optional title (header) */
  title?: string;

  /** Optional subtitle (smaller, secondary text) */
  subtitle?: string;

  /** Card body */
  children?: React.ReactNode;

  /** Optional external style override (rare use only) */
  style?: ViewStyle;
};

/**
 * ============================================================
 * Component
 * ============================================================
 */
export const KeelCard: React.FC<KeelCardProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  const theme = useTheme();

  /**
   * ============================================================
   * Visual decisions (MD3 compliant)
   * ============================================================
   *
   * - background → surface
   * - border     → outline (instead of elevation)
   * - elevation  → 0 (dark mode friendly)
   */
  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
        style,
      ]}
    >
      {(title || subtitle) && (
        <Card.Title
          title={title}
          subtitle={subtitle}
          titleVariant="titleMedium"
          subtitleVariant="bodySmall"
          titleStyle={[
            styles.title,
            { color: theme.colors.onSurface },
          ]}
          subtitleStyle={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        />
      )}

      {children && (
        <Card.Content style={styles.content}>
          {children}
        </Card.Content>
      )}
    </Card>
  );
};

/**
 * ============================================================
 * Styles
 * ============================================================
 *
 * Notes:
 * - Border replaces elevation for dark-mode clarity
 * - Rounded corners match KEEL visual language
 * - Spacing tuned for touch + readability
 */
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,

    // MD3: Prefer border over elevation in dark mode
    borderWidth: 1,

    // Explicitly remove shadow/elevation
    elevation: 0,
  },

  content: {
    paddingBottom: 12,
  },

  title: {
    fontWeight: "600",
  },

  subtitle: {
    // color is injected from theme
  },
});
