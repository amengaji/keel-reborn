// keel-mobile/src/screens/DataSyncScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, ActivityIndicator, useTheme, Surface, ProgressBar } from 'react-native-paper';
import { Ship, CloudDownload, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { SyncService } from '../services/SyncService';


const { width } = Dimensions.get('window');

export default function DataSyncScreen() {
  const theme = useTheme();
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>(); // We will type this properly later
  
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0.1);

  useEffect(() => {
    runSyncSequence();
  }, []);

  const runSyncSequence = async () => {
    try {
      // Step 1: User Profile & Assignments
      setStatus("Fetching Profile & Assignments...");
      await refreshUser(); 
      setProgress(0.3);

      // Step 2: Vessel Details (if assigned)
      if (user?.vesselId) {
        setStatus(`Syncing ${user.vesselName || 'Vessel'} Data...`);
        // Simulate fetch or actually call API if we had a local DB to cache into
        await api.get(`/vessels/${user.vesselId}`); 
      }
      setProgress(0.6);

      // 3. NEW: Run Offline Sync (Upload pending photos)
      setStatus("Syncing offline data...");
      await SyncService.runSync();
      setProgress(0.9);

      // Step 4: Check Tasks / Logs (Placeholder for future offline sync)
      setStatus("Checking Task Progress...");
      await new Promise(r => setTimeout(r, 800)); // Artificial delay for UX smoothness
      setProgress(1.0);

      setStatus("Ready to Sail.");
      setTimeout(() => {
        // Navigate to the Main Tabs -> Home
        navigation.replace("MainTabs"); 
      }, 500);

    } catch (error) {
      console.error("Sync Failed", error);
      // Even if sync fails, let them in, but warn
      setStatus("Sync warning. Entering offline mode...");
      setTimeout(() => navigation.replace("MainTabs"), 1000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Surface style={styles.card} elevation={4}>
        <View style={styles.iconContainer}>
          {progress < 1 ? (
            <CloudDownload size={48} color={theme.colors.primary} />
          ) : (
            <CheckCircle size={48} color="#10B981" />
          )}
        </View>
        
        <Text style={styles.title}>Welcome Aboard, {user?.name}</Text>
        <Text style={styles.subtitle}>Preparing your digital logbook...</Text>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.bar} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </Surface>
      
      <View style={styles.footer}>
        <Ship size={24} color="rgba(255,255,255,0.3)" />
        <Text style={styles.footerText}>KEEL MARITIME SYSTEM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: width * 0.85,
    padding: 30,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0F9FA',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 30 },
  progressContainer: { width: '100%' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  statusText: { marginTop: 12, fontSize: 12, fontWeight: '600', color: '#9CA3AF', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 50, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 2 }
});