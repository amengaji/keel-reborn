//keel-mobile/src/components/home/AttentionItem.tsx

/**
 * ============================================================
 * AttentionItem
 * ============================================================
 *
 * PURPOSE:
 * - Display a single compliance issue on Home Dashboard
 * - Inspector-grade language
 * - Cadet-friendly guidance
 *
 * DESIGN RULES:
 * - Read-only (no state changes)
 * - Severity-driven styling
 * - Always tappable (navigation handled by parent)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

export type AttentionSeverity = "INFO" | "ATTENTION" | "RISK";

interface Props {
  severity: AttentionSeverity;
  title: string;
  description: string;
  recommendation: string;
}

/**
 * ============================================================
 * Component
 * ============================================================
 */
export default function AttentionItem({
  severity,
  title,
  description,
  recommendation,
}: Props) {
  const theme = useTheme();
  const meta = getSeverityMeta(severity, theme);

  return (
    <View style={[styles.container, { borderLeftColor: meta.color }]}>
      {/* Severity + Title */}
      <View style={styles.headerRow}>
        <Text style={[styles.severity, { color: meta.color }]}>
          {meta.label}
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Recommendation */}
      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>
          Recommended next step
        </Text>
        <Text style={styles.recommendationText}>
          {recommendation}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
 * Severity metadata
 * ============================================================ */
function getSeverityMeta(severity: AttentionSeverity, theme: any) {
  switch (severity) {
    case "RISK":
      return {
        label: "RISK",
        color: theme.colors.error,
      };

    case "ATTENTION":
      return {
        label: "ATTENTION",
        color:
          theme.colors.tertiary ??
          theme.colors.warning ??
          "#E6A700",
      };

    case "INFO":
    default:
      return {
        label: "INFO",
        color: theme.colors.primary,
      };
  }
}

/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.02)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },

  severity: {
    fontSize: 12,
    fontWeight: "700",
  },

  title: {
    fontWeight: "700",
    flex: 1,
  },

  description: {
    opacity: 0.85,
    marginBottom: 6,
  },

  recommendationBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },

  recommendationLabel: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
    marginBottom: 2,
  },

  recommendationText: {
    fontSize: 12,
    opacity: 0.75,
  },
});
