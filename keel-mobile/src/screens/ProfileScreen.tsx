//keel-mobile/src/screens/ProfileScreen.tsx

/**
 * ============================================================
 * Profile Screen — Account Identity (Read-Only)
 * ============================================================
 *
 * PURPOSE:
 * - Display user / cadet identity information
 * - Inspector-safe, audit-grade view
 * - NO vessel information (handled in Sea Service)
 * - NO editing at this stage
 *
 * DATA SOURCE:
 * - AuthContext user object ONLY
 *
 * IMPORTANT:
 * - This screen is intentionally conservative
 * - Missing data is shown explicitly as "Not available"
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Divider,
  useTheme,
} from "react-native-paper";

import { KeelScreen } from "../components/ui/KeelScreen";
import { useAuth } from "../auth/AuthContext";

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  /**
   * Defensive access:
   * AuthContext may evolve later, so we guard every field.
   */
  const fullName =
    user?.name && user.name.trim().length > 0
      ? user.name
      : "Not available";

  const email =
    user?.email && user.email.trim().length > 0
      ? user.email
      : "Not available";

  const userId =
    user?.id !== undefined && user?.id !== null
      ? String(user.id)
      : "Not available";

  const role =
    (user as any)?.role
      ? (user as any).role
      : "Not available";

  return (
    <KeelScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================
            PAGE TITLE
           ====================================================== */}
        <Text variant="headlineMedium" style={styles.pageTitle}>
          Profile
        </Text>

        {/* ======================================================
            1) USER IDENTITY
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              User Identity
            </Text>

            <Divider style={styles.divider} />

            <ProfileRow label="Full Name" value={fullName} />
            <ProfileRow label="Role / Category" value={role} />
          </Card.Content>
        </Card>

        {/* ======================================================
            2) ACCOUNT DETAILS
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Account Details
            </Text>

            <Divider style={styles.divider} />

            <ProfileRow label="Email" value={email} />
            <ProfileRow label="User ID" value={userId} />
            <ProfileRow label="Account Status" value="Active" />
          </Card.Content>
        </Card>

        {/* ======================================================
            3) APPLICATION / SESSION (PLACEHOLDERS)
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Application & Session
            </Text>

            <Divider style={styles.divider} />

            <ProfileRow
              label="Last Login"
              value="Not available"
            />
            <ProfileRow
              label="Sync Status"
              value="Not available"
            />
            <ProfileRow
              label="App Version"
              value="Not available"
            />
          </Card.Content>
        </Card>

        {/* ======================================================
            FOOTNOTE (INTENTIONAL DESIGN)
           ====================================================== */}
        <Text style={styles.footerNote}>
          Vessel assignment and sea service records are maintained
          separately under the Sea Service module.
        </Text>
      </ScrollView>
    </KeelScreen>
  );
}

/* ============================================================
 * Small helper row component
 * ============================================================ */
function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 24,
  },

  pageTitle: {
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    marginBottom: 16,
  },

  cardTitle: {
    fontWeight: "700",
  },

  divider: {
    marginVertical: 12,
  },

  row: {
    marginBottom: 10,
  },

  rowLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },

  rowValue: {
    fontSize: 16,
  },

  footerNote: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 16,
  },
});
