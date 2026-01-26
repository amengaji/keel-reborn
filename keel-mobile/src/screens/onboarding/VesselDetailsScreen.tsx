//keel-mobile/src/screens/onboarding/VesselDetailsScreen.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, TextInput, Divider } from "react-native-paper";
import { Ship, MapPin } from "lucide-react-native";

// Custom Components
import { KeelButton } from "../../components/ui/KeelButton";
import DateInputField from "../../components/inputs/DateInputField";
import { useAuth } from "../../auth/AuthContext";
import { assignmentService } from "../../services/api";

export default function VesselDetailsScreen() {
  const theme = useTheme();
  // We get the 'user' object here to see what vessel they were assigned by Shore Admin
  const { user, setOnboardingCompleted, refreshUser } = useAuth();

  // Form State
  const [date, setDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle the Join Confirmation
   * This function sends the specific date/port to the backend 
   * to "Activate" the assignment that the Admin already created.
   */
  const handleJoin = async () => {
    // SECURITY: Ensure we have an assigned vessel ID before proceeding
    if (!user?.vesselId || !date) return;

    setIsSubmitting(true);
    try {
      // 1. Send Join Request for the ASSIGNED vessel (Locked ID)
      await assignmentService.joinVessel({
        sign_on_date: date.toISOString(),
        sign_on_port: port,
        vesselId: user.vesselId // ✅ Locked to the Admin-assigned ID
      });

      // 2. Refresh User to get the new 'Onboard' status from backend
      await refreshUser();

      // 3. Complete Onboarding -> Redirect to Main Dashboard
      setOnboardingCompleted(true);
    } catch (e) {
      console.error("Join failed", e);
      alert("Failed to join vessel. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Confirm Assignment
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Please verify your assigned vessel and enter your sign-on details.
          </Text>
        </View>

        {/* LOCKED VESSEL CARD 
           This replaces the "Selector" functionality.
           It displays the Admin-assigned vessel in a read-only format.
        */}
        <View style={[styles.vesselCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <View style={styles.vesselHeader}>
                <Ship size={24} color={theme.colors.primary} />
                <Text style={[styles.vesselLabel, { color: theme.colors.primary }]}>
                    OFFICIAL ASSIGNMENT
                </Text>
            </View>
            
            {/* Display the Vessel Name assigned by Shore Admin */}
            <Text style={[styles.vesselName, { color: theme.colors.onSurface }]}>
                {user?.vesselName || "Unknown Vessel"}
            </Text>
            
            <Text style={[styles.vesselDetail, { color: theme.colors.onSurfaceVariant }]}>
                Rank: {user?.rank || "Cadet"}
            </Text>
        </View>

        <Divider style={{ marginVertical: 24 }} />

        {/* Form Container */}
        <View style={styles.formContainer}>
          
          {/* Port Selector */}
          <TextInput
             mode="outlined"
             label="Port of Embarkation"
             placeholder="e.g. Singapore"
             value={port}
             onChangeText={setPort}
             style={{ backgroundColor: theme.colors.surface }}
             outlineColor={theme.colors.outline}
             activeOutlineColor={theme.colors.primary}
             right={<TextInput.Icon icon={() => <MapPin size={20} color={theme.colors.onSurfaceVariant}/>} />}
          />

          <View style={styles.spacer} />

          {/* Date Selector */}
          <DateInputField 
            label="Sign On Date"
            value={date}
            onChange={setDate}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <KeelButton 
            mode="primary"
            onPress={handleJoin}
            loading={isSubmitting}
            disabled={!date || !user?.vesselId}
          >
            Confirm & Launch
          </KeelButton>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  
  // Vessel Card Styles (Locked Look)
  vesselCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  vesselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  vesselLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 8
  },
  vesselName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  vesselDetail: {
    fontSize: 14,
  },

  formContainer: { flex: 1 },
  spacer: { height: 20 },
  footer: { marginBottom: 20 },
});