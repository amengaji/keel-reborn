//keel-mobile/src/components/home/ComplianceIndicatorCard.tsx

/**
 * ============================================================
 * ComplianceIndicatorCard (Refactored — Inline Attention UX)
 * ============================================================
 *
 * PURPOSE:
 * - Single source of truth for compliance status on Home
 * - Inline attention handling (no separate Attention panel)
 *
 * UX RULES:
 * - INFO → minimal, no noise
 * - ATTENTION → explanation + recommendation
 * - RISK → explanation + recommendation + toast handled by parent
 *
 * DESIGN:
 * - Inspector-grade
 * - Cadet self-awareness without clutter
 * - Theme-safe
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, Divider, useTheme } from "react-native-paper";

export type ComplianceStatus =
  | "INFO"
  | "ON_TRACK"
  | "ATTENTION"
  | "RISK"
  | "NOT_AVAILABLE";

interface Props {
  title: string;
  status: ComplianceStatus;
  summary: string;

  /** Shown ONLY for ATTENTION / RISK */
  explanation?: string;

  /** Shown ONLY for ATTENTION / RISK */
  recommendation?: string;
}

export default function ComplianceIndicatorCard({
  title,
  status,
  summary,
  explanation,
  recommendation,
}: Props) {
  const theme = useTheme();
  const meta = getStatusMeta(status, theme);

  const showAttentionDetails =
    status === "ATTENTION" || status === "RISK";

  return (
    <Card style={[styles.card, { borderLeftColor: meta.color }]}>
      <Card.Content>
        {/* --------------------------------------------------
            Title
           -------------------------------------------------- */}
        <Text variant="titleSmall" style={styles.title}>
          {title}
        </Text>

        <Divider style={styles.divider} />

        {/* --------------------------------------------------
            Status line
           -------------------------------------------------- */}
        <Text style={[styles.statusText, { color: meta.color }]}>
          {meta.label}
        </Text>

        <Text style={styles.summaryText}>{summary}</Text>

        {/* --------------------------------------------------
            Inline attention (ONLY when needed)
           -------------------------------------------------- */}
        {showAttentionDetails && explanation && (
          <View style={styles.attentionBox}>
            <Text style={styles.attentionLabel}>
              What this means
            </Text>
            <Text style={styles.attentionText}>
              {explanation}
            </Text>

            {recommendation && (
              <>
                <Divider style={styles.innerDivider} />
                <Text style={styles.recommendationLabel}>
                  Recommended next step
                </Text>
                <Text style={styles.recommendationText}>
                  {recommendation}
                </Text>
              </>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

/* ============================================================
 * Status metadata
 * ============================================================ */
function getStatusMeta(status: ComplianceStatus, theme: any) {
  switch (status) {
    case "RISK":
      return {
        label: "Compliance Risk",
        color: theme.colors.error,
      };

    case "ATTENTION":
      return {
        label: "Attention Required",
        color:
          theme.colors.tertiary ??
          theme.colors.warning ??
          "#E6A700",
      };

    case "ON_TRACK":
      return {
        label: "On Track",
        color: theme.colors.primary,
      };

    case "NOT_AVAILABLE":
      return {
        label: "Data Not Available",
        color: theme.colors.onSurfaceVariant,
      };

    case "INFO":
    default:
      return {
        label: "Info",
        color: theme.colors.primary,
      };
  }
}

/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderLeftWidth: 4,
  },

  title: {
    fontWeight: "700",
  },

  divider: {
    marginVertical: 6,
  },

  statusText: {
    fontWeight: "700",
    marginBottom: 2,
  },

  summaryText: {
    opacity: 0.85,
  },

  attentionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  attentionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    opacity: 0.7,
  },

  attentionText: {
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 6,
  },

  innerDivider: {
    marginVertical: 6,
  },

  recommendationLabel: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
    marginBottom: 2,
  },

  recommendationText: {
    fontSize: 12,
    opacity: 0.85,
  },
});
