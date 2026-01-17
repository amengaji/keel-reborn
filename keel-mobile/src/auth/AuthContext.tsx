// keel-mobile/src/auth/AuthContext.tsx

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

export interface User {
  id: number;
  name: string;
  email: string;
  category: string;
  dob?: string;
  pob?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  mobileNumbers?: string[];
  passportNo?: string;
  passportDoi?: string;
  passportPoi?: string;
  passportDoe?: string;
  sbNo?: string;
  sbDoi?: string;
  sbPoi?: string;
  sbDoe?: string;
  sidNo?: string;
  indosNo?: string;
  nokName?: string;
  nokRelation?: string;
  nokContact?: string;
  nokEmail?: string;
  profileImage?: string;
}

type ThemeMode = "light" | "dark";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUser: (updates: Partial<User>) => Promise<void>; // Added for profile editing

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

  /**
   * PERSISTENT PROFILE UPDATE
   * Merges updates into current user and saves to local SecureStore.
   */
  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // OPTIONAL: Sync with backend API if connected
      // await api.patch("/me/profile", updates);
    } catch (error) {
      console.error("FAILED TO UPDATE USER STATE:", error);
    }
  };

  const markWelcomeSeen = async () => {
    await SecureStore.setItemAsync("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  const markBiometricPromptSeen = async () => {
    await SecureStore.setItemAsync("biometricPromptSeen", "true");
    setHasSeenWelcome(true);
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
    try {
      const res = await api.post("/auth/login", { email, password });
      console.log("LOGIN SUCCESS:", res.data);

      await SecureStore.setItemAsync("accessToken", res.data.accessToken);
      await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
    } catch (error: any) {
      console.log("LOGIN ERROR FULL:", error);
      console.log("LOGIN ERROR RESPONSE:", error?.response?.data);
      throw error;
    }
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

    try {
      const res = await api.post("/auth/refresh", { refreshToken });
      await SecureStore.setItemAsync("accessToken", res.data.accessToken);

      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) setUser(JSON.parse(storedUser));

      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUser, // Exposing update method

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