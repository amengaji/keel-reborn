//keel-mobile/src/screens/DataSyncScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native"; // ✅ Added Platform
import { Text, ActivityIndicator, useTheme, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Services & DB
import { useAuth } from "../auth/AuthContext";
import { taskService } from "../services/api";
import { syncTasksFromShore } from "../db/tasks";
import { MainStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "DataSync">;

export default function DataSyncScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  // ✅ Removed 'token', relying on user presence
  const { user, refreshUser } = useAuth();
  
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0.1);

  useEffect(() => {
    // Only run if we have a user context (AuthNavigator handles the null case)
    if (user) {
        runSyncSequence();
    }
  }, [user]); // Re-run if user object changes/hydrates

  const runSyncSequence = async () => {
    try {
      // 1. REFRESH PROFILE
      setStatus("Checking Profile...");
      setProgress(0.3);
      
      // We await the refresh, but don't assign the result since it might be void.
      await refreshUser(); 
      
      // We read the rank from the current user object. 
      // Fallback to "Deck Cadet" if undefined during initial boot.
      const userRank = user?.rank || "Deck Cadet"; 

      // 2. SYNC TASKS
      setStatus(`Syncing ${userRank} Tasks...`);
      setProgress(0.5);

      try {
        // A. Fetch from Shore
        const shoreTasks = await taskService.getByRank(userRank);
        
        // B. Save to Local DB
        if (shoreTasks && shoreTasks.length > 0) {
            await syncTasksFromShore(shoreTasks);
        } else {
            console.log("No tasks returned from shore.");
        }
      } catch (taskError) {
        console.warn("Task sync failed (likely offline). Using cached DB.");
      }

      // 3. FINALIZE
      setProgress(1.0);
      setStatus("Ready.");
      
      setTimeout(() => {
        navigation.replace("MainTabs");
      }, 500);

    } catch (e) {
      console.error("Sync Fatal Error", e);
      // If sync fails completely, allow user to retry
      Alert.alert(
        "Sync Failed",
        "Could not load data. Check connection.",
        [{ text: "Retry", onPress: runSyncSequence }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        
        <Text variant="titleLarge" style={styles.title}>
          Keel
        </Text>
        
        <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginBottom: 20 }}>
            Maritime Competency System
        </Text>

        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.bar} />
        
        <Text variant="bodySmall" style={styles.status}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { width: "70%", alignItems: "center" },
  title: { fontWeight: "900", letterSpacing: 1, marginBottom: 4 },
  bar: { height: 6, borderRadius: 3, width: '100%' },
  status: { marginTop: 12, opacity: 0.6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }
});