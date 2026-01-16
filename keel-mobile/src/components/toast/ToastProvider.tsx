// keel-mobile/src/components/toast/ToastProvider.tsx

/**
 * ============================================================
 * Global Toast Provider (MULTI-LINE SAFE)
 * ============================================================
 *
 * FIXES:
 * - Enables true multi-line wrapping
 * - Prevents text truncation
 * - Tablet + phone responsive
 * - Keeps useToast() API unchanged
 */

import React, { createContext, ReactNode } from "react";
import Toast from "react-native-toast-message";
import { View, Text, StyleSheet, Dimensions, Appearance } from "react-native";
import { useTheme } from "react-native-paper";
import { keelLightTheme, keelDarkTheme } from "../../theme/keelTheme";

/**
 * Toast severity types.
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Context shape.
 */
export interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/**
 * Internal context.
 */
export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

/**
 * ============================================================
 * Custom Toast Layout (MULTI-LINE SAFE)
 * ============================================================
 */
function ToastCard({
  title,
  message,
  borderColor,
}: {
  title: string;
  message: string;
  borderColor: string;
}) {
  const theme =
    Appearance.getColorScheme() === "dark"
      ? keelDarkTheme
      : keelLightTheme;

  return (
    <View
      style={[
        styles.toast,
        {
          borderLeftColor: borderColor,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

/**
 * ============================================================
 * Toast Configuration
 * ============================================================
 */
export const toastConfig = {
  success: ({ text2 }: any) => (
    <ToastCard
      title="Success"
      message={text2}
      borderColor={keelLightTheme.colors.primary}
    />
  ),

  error: ({ text2 }: any) => (
    <ToastCard
      title="Error"
      message={text2}
      borderColor={keelLightTheme.colors.error}
    />
  ),

  warning: ({ text2 }: any) => (
    <ToastCard
      title="Warning"
      message={text2}
      borderColor="#f59e0b"
    />
  ),

  info: ({ text2 }: any) => (
    <ToastCard
      title="Info"
      message={text2}
      borderColor="#3b82f6"
    />
  ),
};

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const contextValue: ToastContextType = {
    success: (msg) =>
      Toast.show({
        type: "success",
        text2: msg,
        position: "top",
      }),

    error: (msg) =>
      Toast.show({
        type: "error",
        text2: msg,
        position: "top",
      }),

    warning: (msg) =>
      Toast.show({
        type: "warning",
        text2: msg,
        position: "top",
      }),

    info: (msg) =>
      Toast.show({
        type: "info",
        text2: msg,
        position: "top",
      }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast config={toastConfig} />
    </ToastContext.Provider>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  toast: {
    width: isTablet ? "90%" : "95%",
    paddingHorizontal: isTablet ? 20 : 14,
    paddingVertical: 14,
    borderLeftWidth: 6,
    borderRadius: 12,
    marginTop: 10,
  },

  title: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  message: {
    fontSize: isTablet ? 16 : 13,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: "wrap",
  },
});
