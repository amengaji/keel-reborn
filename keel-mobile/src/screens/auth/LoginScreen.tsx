//keel-mobile/src/screens/auth/LoginScreen.tsx

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
// ✅ FIXED: Path updated (../../ to go up from 'auth' folder)
import { KeelButton } from "../../components/ui/KeelButton";
import { useAuth } from "../../auth/AuthContext";

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
          {/* ✅ FIXED: Path updated to go up 3 levels to root assets */}
          <Image
            source={require("../../../assets/keel-logo.png")}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: "center", padding: 20 },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoImage: { width: 60, height: 60 },
  appName: { fontSize: 32, fontWeight: "900", color: "#FFF", letterSpacing: 4 },
  appTag: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 2, marginTop: 4 },
  
  formCard: { borderRadius: 24, padding: 30, backgroundColor: "#FFF" },
  welcomeText: { fontSize: 24, fontWeight: "800", color: "#111827", textAlign: "center" },
  subText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 30, marginTop: 4 },
  
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, marginBottom: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, backgroundColor: "transparent", height: 56, fontSize: 16 },
  
  loginBtn: { borderRadius: 12, marginTop: 10, backgroundColor: "#3194A0" },
  
  bioBtn: { marginTop: 24, alignItems: "center" },
  bioText: { color: "#3194A0", fontSize: 12, fontWeight: "600", marginTop: 8 },
  
  footer: { alignItems: "center", marginTop: 40 },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 12 }
});