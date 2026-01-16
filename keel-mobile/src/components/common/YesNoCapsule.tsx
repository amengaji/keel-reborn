//keel-mobile/src/components/common/YesNoCapsule.tsx

/**
 * ============================================================
 * YesNoCapsule — Segmented Decision Control (PSC-Safe)
 * ============================================================
 *
 * PURPOSE:
 * - Compact YES / NO segmented control
 * - Designed to sit INLINE on the right of a row
 * - Forces explicit true / false (no undefined)
 *
 * IMPORTANT:
 * - NO label inside this component
 * - Parent controls layout and text
 * - PURE UI (no saving, no validation)
 *
 * VALUE MAPPING:
 * - YES => true
 * - NO  => false
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

type Props = {
  /** Current value (explicit boolean) */
  value: boolean;

  /** Change handler */
  onChange: (value: boolean) => void;
};

export default function YesNoCapsule({ value, onChange }: Props) {
  const theme = useTheme();

  const yesActive = value === true;
  const noActive = value === false;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {/* YES */}
      <Pressable
        onPress={() => onChange(true)}
        style={[
          styles.segment,
          yesActive && {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: yesActive
                ? theme.colors.onPrimary
                : theme.colors.onSurface,
            },
          ]}
        >
          YES
        </Text>
      </Pressable>

      {/* NO */}
      <Pressable
        onPress={() => onChange(false)}
        style={[
          styles.segment,
          noActive && {
            backgroundColor: theme.colors.error,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: noActive
                ? theme.colors.onError
                : theme.colors.onSurface,
            },
          ]}
        >
          NO
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    height: 32,
    minWidth: 96,
  },

  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});  

