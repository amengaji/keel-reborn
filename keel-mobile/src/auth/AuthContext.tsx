//keel-mobile/src/auth/AuthContext.tsx

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

type ThemeMode = "light" | "dark";

interface AuthContextType {
  user: User | null;
  loading: boolean;

  biometricEnabled: boolean;
  biometricPromptSeen: boolean;

  onboardingCompleted: boolean;
  markOnboardingCompleted: () => Promise<void>;

  hasSeenWelcome: boolean;
  setHasSeenWelcome: () => Promise<void>;

  markBiometricPromptSeen: () => Promise<void>;

  themeMode: ThemeMode;
  toggleTheme: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  enableBiometrics: () => Promise<void>;
  biometricLogin: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricPromptSeen, setBiometricPromptSeen] = useState(false);

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    const storedUser = await SecureStore.getItemAsync("user");

    const bio = await SecureStore.getItemAsync("biometricEnabled");
    const bioSeen = await SecureStore.getItemAsync("biometricPromptSeen");

    const onboarding = await SecureStore.getItemAsync("onboardingCompleted");
    const welcome = await SecureStore.getItemAsync("hasSeenWelcome");

    const storedTheme = await SecureStore.getItemAsync("themeMode");

    setBiometricEnabled(bio === "true");
    setBiometricPromptSeen(bioSeen === "true");

    setOnboardingCompleted(onboarding === "true");
    setHasSeenWelcome(welcome === "true");

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeMode(storedTheme);
    }

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  };

  const markWelcomeSeen = async () => {
    await SecureStore.setItemAsync("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  const markBiometricPromptSeen = async () => {
    await SecureStore.setItemAsync("biometricPromptSeen", "true");
    setBiometricPromptSeen(true);
  };

  const markOnboardingCompleted = async () => {
    await SecureStore.setItemAsync("onboardingCompleted", "true");
    setOnboardingCompleted(true);
  };

  const toggleTheme = async () => {
    const nextTheme: ThemeMode = themeMode === "light" ? "dark" : "light";
    await SecureStore.setItemAsync("themeMode", nextTheme);
    setThemeMode(nextTheme);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });

    await SecureStore.setItemAsync("accessToken", res.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  const enableBiometrics = async () => {
    await SecureStore.setItemAsync("biometricEnabled", "true");
    setBiometricEnabled(true);
  };

  const biometricLogin = async () => {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate",
    });
    if (!auth.success) return false;

    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!refreshToken) return false;

    const res = await api.post("/auth/refresh", { refreshToken });
    await SecureStore.setItemAsync("accessToken", res.data.accessToken);

    const storedUser = await SecureStore.getItemAsync("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    return true;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        biometricEnabled,
        biometricPromptSeen,

        onboardingCompleted,
        markOnboardingCompleted,

        hasSeenWelcome,
        setHasSeenWelcome: markWelcomeSeen,

        markBiometricPromptSeen,

        themeMode,
        toggleTheme,

        login,
        logout,

        enableBiometrics,
        biometricLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
