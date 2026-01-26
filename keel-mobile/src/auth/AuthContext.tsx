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
  
  // Maritime Status
  rank?: string;
  status?: string; // 'Ready', 'Onboard', 'Leave'
  vesselId?: number;
  vesselName?: string;
  department?: string;

  // Personal
  dob?: string;
  pob?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  mobileNumbers?: string[];
  
  // Docs
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
  
  // Kin
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
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>; // <--- ADDED REFRESH

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
    try {
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
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (parseError) {
          console.error("Failed to parse stored user JSON:", parseError);
          await SecureStore.deleteItemAsync("user");
        }
      }
    } catch (e) {
      console.error("Session restore failed", e);
    } finally {
      setLoading(false);
    }
  };

  // --- REFRESH USER FROM BACKEND ---
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const freshUser = res.data;
      
      // Standardize fields if needed
      const mappedUser: User = {
         ...freshUser,
         name: freshUser.name || `${freshUser.first_name} ${freshUser.last_name}`
      };

      setUser(mappedUser);
      await SecureStore.setItemAsync("user", JSON.stringify(mappedUser));
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      // 1. Optimistic UI Update
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      
      // 2. Sync with Backend
      // We pass only specific fields that the backend accepts in updateProfile
      const payload: any = { userId: user.id };
      if (updates.status) payload.status = updates.status;
      if (updates.mobileNumbers) payload.mobile = updates.mobileNumbers[0]; // Example mapping
      
      await api.put("/auth/profile", payload);
      
      // 3. Fetch fresh to ensure sync
      await refreshUser();

    } catch (error) {
      console.error("FAILED TO UPDATE USER STATE:", error);
      // Revert if needed, but for now we keep simple
    }
  };

  const markWelcomeSeen = async () => {
    await SecureStore.setItemAsync("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  const markBiometricPromptSeen = async () => {
    await SecureStore.setItemAsync("biometricPromptSeen", "true");
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

      const { accessToken, refreshToken, user } = res.data;

      await SecureStore.setItemAsync("accessToken", accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync("refreshToken", refreshToken);
      }
      await SecureStore.setItemAsync("user", JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setUser(user);
    } catch (error: any) {
      console.log("LOGIN ERROR FULL:", error);
      throw error;
    }
  };

  const enableBiometrics = async () => {
    await SecureStore.setItemAsync("biometricEnabled", "true");
    setBiometricEnabled(true);
  };

  const biometricLogin = async () => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) return false;

        const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: "Authenticate",
        });
        
        if (!auth.success) return false;

        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) return false;

        const res = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = res.data.accessToken;

        await SecureStore.setItemAsync("accessToken", newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        const storedUser = await SecureStore.getItemAsync("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        return true;
    } catch (e) {
        console.log("Biometric Login Failed:", e);
        return false;
    }
  };

  const logout = async () => {
    try {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        await SecureStore.deleteItemAsync("user");
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    } catch (e) {
        console.error("Logout error", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUser,
        refreshUser,

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