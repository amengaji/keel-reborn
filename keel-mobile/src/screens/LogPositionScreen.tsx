//keel-mobile/src/screens/LogPositionScreen.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Button, Text, useTheme, TextInput, Surface, Divider } from "react-native-paper";
import { MapPin, Navigation, Clock, MessageSquare } from "lucide-react-native";
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useNavigation } from "@react-navigation/native";

/**
 * UNIVERSAL ACTIVITY LOG (Deck, Engine, ETO, Catering)
 * PURPOSE: Auto-capture GPS/Time and allow Trainee to log specific events.
 */
export const LogPositionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [locationData, setLocationData] = useState<{
    lat: string;
    lon: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      // Request permission for GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ 
          type: 'error', 
          text1: 'Permission Denied', 
          text2: 'GPS access is required for logging activities.' 
        });
        setLoading(false);
        return;
      }

      // Fetch location
      let location = await Location.getCurrentPositionAsync({});
      // FIX: Use location.timestamp instead of location.coords.timestamp
      const date = new Date(location.timestamp);
      
      setLocationData({
        lat: location.coords.latitude.toFixed(4),
        lon: location.coords.longitude.toFixed(4),
        timestamp: date.toUTCString().replace('GMT', 'UTC')
      });
      setLoading(false);
    })();
  }, []);

  const handleSave = () => {
    if (!reason.trim()) {
      Toast.show({ 
        type: 'error', 
        text1: 'Entry Required', 
        text2: 'Please describe the activity or reason for this log.' 
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Activity Logged',
      text2: 'GPS data and event details recorded.',
      position: 'bottom',
      bottomOffset: 100
    });
    
    // Smooth transition back to dashboard
    setTimeout(() => navigation.goBack(), 1500);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        
        {/* AUTO-CAPTURED DATA CARD */}
        <Surface style={styles.dataCard} elevation={1}>
          <View style={styles.cardHeader}>
            <Navigation color={theme.colors.primary} size={20} />
            <Text style={styles.cardLabel}>AUTO-CAPTURED SNAPSHOT</Text>
          </View>
          <Divider style={styles.divider} />
          
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 10 }} />
          ) : (
            <View>
              <View style={styles.dataRow}>
                <Clock size={16} color={theme.colors.outline} />
                <Text style={styles.dataText}>{locationData?.timestamp}</Text>
              </View>
              <View style={styles.dataRow}>
                <MapPin size={16} color={theme.colors.outline} />
                <Text style={styles.dataText}>
                  {locationData?.lat}°N, {locationData?.lon}°E
                </Text>
              </View>
            </View>
          )}
        </Surface>

        {/* REASON FOR ENTRY */}
        <View style={styles.inputSection}>
          <View style={styles.cardHeader}>
            <MessageSquare color={theme.colors.primary} size={20} />
            <Text style={styles.cardLabel}>ACTIVITY / REASON</Text>
          </View>
          <TextInput
            mode="outlined"
            placeholder="e.g., Altered Course / Checked Bilges / Generator Test / Meal Prep Started..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={5}
            style={styles.textArea}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />
          <Text variant="bodySmall" style={styles.hint}>
            Provide context for this GPS snapshot.
          </Text>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={{ height: 56 }}
        >
          SAVE ACTIVITY LOG
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  dataCard: { padding: 20, borderRadius: 20, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardLabel: { marginLeft: 10, fontSize: 11, fontWeight: '900', color: 'rgba(128,128,128,0.8)', letterSpacing: 1 },
  divider: { marginBottom: 16, opacity: 0.3 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dataText: { marginLeft: 12, fontWeight: '700', fontSize: 14 },
  inputSection: { marginBottom: 30 },
  textArea: { backgroundColor: 'transparent', fontSize: 15 },
  hint: { marginTop: 8, opacity: 0.6, fontStyle: 'italic' },
  submitButton: { borderRadius: 14 }
});