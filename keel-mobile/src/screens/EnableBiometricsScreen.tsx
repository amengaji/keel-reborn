//keel-mobile/src/screens/EnableBiometricsScreen.tsx

console.log(">>> BIOMETRICS SCREEN <<<");

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useAuth } from "../auth/AuthContext";

export default function EnableBiometricsScreen() {
  const theme = useTheme();
  const {
    enableBiometrics,
    markBiometricPromptSeen,
  } = useAuth();

  const handleEnable = async () => {
    await enableBiometrics();
    await markBiometricPromptSeen();
  };

  const handleSkip = async () => {
    await markBiometricPromptSeen();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      padding: 24,
      paddingTop: 120,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 36,
    },
    primaryButton: {
      width: "100%",
      marginBottom: 12,
    },
    secondaryButton: {
      width: "100%",
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Enable Biometric Login
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Use your fingerprint or face to sign in faster and more securely.
      </Text>

      <Button
        mode="contained"
        onPress={handleEnable}
        style={styles.primaryButton}
      >
        Enable Biometrics
      </Button>

      <Button
        mode="outlined"
        onPress={handleSkip}
        style={styles.secondaryButton}
      >
        Skip for Now
      </Button>
    </View>
  );
}
