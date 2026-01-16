//keel-mobile/src/screens/SettingsScreen.tsx

/**
 * ============================================================
 * Settings Screen — User Preferences & Security
 * ============================================================
 *
 * PURPOSE:
 * - Allow user to manage local preferences
 * - Control security-related features
 * - Provide safe session actions (logout)
 *
 * IMPORTANT:
 * - No business logic here
 * - Uses ONLY existing AuthContext APIs
 * - No database writes
 * - Inspector-grade clarity
 */

import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  Divider,
  Button,
  Switch,
  useTheme,
} from "react-native-paper";

import { KeelScreen } from "../components/ui/KeelScreen";
import { useAuth } from "../auth/AuthContext";

export default function SettingsScreen() {
  const theme = useTheme();

  const {
    themeMode,
    toggleTheme,
    biometricEnabled,
    enableBiometrics,
    logout,
  } = useAuth();

  /* ------------------------------------------------------------
   * Handlers
   * ---------------------------------------------------------- */

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "You will be signed out of KEEL on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

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
          Settings
        </Text>

        {/* ======================================================
            1) APPEARANCE
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Appearance
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>Theme</Text>
                <Text style={styles.rowValue}>
                  {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>

              <Switch
                value={themeMode === "dark"}
                onValueChange={toggleTheme}
              />
            </View>
          </Card.Content>
        </Card>

        {/* ======================================================
            2) SECURITY & ACCESS
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Security & Access
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>
                  Biometric Login
                </Text>
                <Text style={styles.rowValue}>
                  {biometricEnabled
                    ? "Enabled"
                    : "Not enabled"}
                </Text>
              </View>

              {!biometricEnabled && (
                <Button
                  mode="outlined"
                  onPress={enableBiometrics}
                >
                  Enable
                </Button>
              )}
            </View>

            <Divider style={styles.divider} />

            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={handleLogout}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>

        {/* ======================================================
            3) APPLICATION (PLACEHOLDERS)
           ====================================================== */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Application
            </Text>

            <Divider style={styles.divider} />

            <ProfileRow
              label="App Version"
              value="Not available"
            />
            <ProfileRow
              label="Environment"
              value="Not available"
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </KeelScreen>
  );
}

/* ============================================================
 * Helper row component
 * ============================================================ */
function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.simpleRow}>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  simpleRow: {
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
});
