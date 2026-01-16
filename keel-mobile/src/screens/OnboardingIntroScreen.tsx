//keel-mobile/src/screens/OnboardingIntroScreen.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useAuth } from "../auth/AuthContext";

export default function OnboardingIntroScreen() {
  const theme = useTheme();
  const { markOnboardingCompleted } = useAuth();

  const handleContinue = async () => {
    await markOnboardingCompleted();
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
      marginBottom: 16,
      textAlign: "center",
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 22,
    },
    button: {
      width: "100%",
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to KEEL
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        KEEL helps cadets track training, complete tasks, and maintain their
        digital training record book — even when offline.
      </Text>

      <Button
        mode="contained"
        onPress={handleContinue}
        style={styles.button}
      >
        Continue
      </Button>
    </View>
  );
}
