//keel-mobile/src/screens/LoginScreen.tsx

console.log(">>> NEW LOGIN SCREEN IS RENDERING <<<");

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { KeelButton } from "../components/ui/KeelButton";
import { useAuth } from "../auth/AuthContext";

export default function LoginScreen() {
  const theme = useTheme();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 28,
      paddingTop: 80,
    },
    headerWrapper: {
      alignItems: "center",
      marginBottom: 48,
    },
    logo: {
      width: 76,
      height: 76,
      marginBottom: 16,
    },
    title: {
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 6,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    formWrapper: {
      marginTop: 16,
    },
    input: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      fontSize: 13,
    },
    loginButton: {
      marginTop: 18,
    },
    footerSpace: {
      flex: 1,
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <Image
            source={require("../../assets/keel-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text variant="headlineMedium" style={styles.title}>
            Welcome Aboard
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue your training
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formWrapper}>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          {error.length > 0 && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <KeelButton
            mode="primary"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          >
            {loading ? "Signing in..." : "Sign In"}
          </KeelButton>
        </View>

        <View style={styles.footerSpace} />
      </View>
    </KeyboardAvoidingView>
  );
}
