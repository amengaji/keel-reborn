//keel-mobile/src/screens/WelcomeScreen.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { KeelButton } from "../components/ui/KeelButton";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function WelcomeScreen() {
  const { setHasSeenWelcome } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const handleContinue = async () => {
    await setHasSeenWelcome();
    navigation.replace("Login");
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
      marginBottom: 12,
      color: theme.colors.primary,
    },
    subtitle: {
      textAlign: "center",
      marginBottom: 32,
      color: theme.colors.onSurfaceVariant,
    },
    primaryButton: {
      marginTop: 24,
      minWidth: 220,
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Welcome to KEEL
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Your digital cadet training record book
      </Text>

      <KeelButton
        mode="primary"
        onPress={handleContinue}
        style={styles.primaryButton}
      >
        Get Started
      </KeelButton>
    </View>
  );
}
