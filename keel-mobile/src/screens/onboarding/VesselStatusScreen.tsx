//keel-mobile/src/screens/onboarding/VesselStatusScreen.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper"; 

// Custom Components
import { KeelButton } from "../../components/ui/KeelButton";
import YesNoCapsule from "../../components/common/YesNoCapsule";
import { useAuth } from "../../auth/AuthContext";

// Types
import { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "VesselStatus">;

export default function VesselStatusScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  
  // ✅ Get the User Profile to check for assignment
  const { user, setOnboardingCompleted } = useAuth(); 

  const [isOnboard, setIsOnboard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle the Next Step
   * NOW WITH SECURITY CHECK
   */
  const handleContinue = async () => {
    setIsSubmitting(true);
    
    // UX Delay
    setTimeout(() => {
      setIsSubmitting(false);

      if (isOnboard) {
        // 🔒 SECURITY CHECK: Does the user actually have a vessel assigned?
        // If 'vesselId' is null/undefined, they are blocked.
        if (!user?.vesselId) {
            Alert.alert(
                "No Assignment Found",
                "Shore Admin has not assigned a vessel to your profile yet.\n\nPlease contact your fleet manager.",
                [{ text: "OK", onPress: () => setIsOnboard(false) }] // Reset switch
            );
            return;
        }

        // ✅ User is assigned -> Proceed to Confirmation Screen
        navigation.navigate("VesselDetails");
        
      } else {
        // User is Shore-based -> Finish Onboarding
        setOnboardingCompleted(true);
      }
    }, 500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Current Status
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            To customize your experience, tell us where you are currently located.
          </Text>
        </View>

        <View style={styles.selectionContainer}>
          <Text style={[styles.questionLabel, { color: theme.colors.onBackground }]}>
            Are you currently onboard a vessel?
          </Text>
          
          <View style={[
            styles.capsuleWrapper, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline 
            }
          ]}>
            <Text style={[styles.capsuleLabel, { color: theme.colors.onSurface }]}>
              I am currently signed on
            </Text>
            
            <YesNoCapsule 
              value={isOnboard} 
              onChange={setIsOnboard} 
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            {isOnboard 
              ? "We'll set up your Sea Service and Watchkeeping logs next."
              : "We'll take you to your shore training dashboard."}
          </Text>
          
          <KeelButton 
            mode="primary"
            onPress={handleContinue}
            loading={isSubmitting}
          >
            {isOnboard ? "Verify Assignment" : "Go to Dashboard"}
          </KeelButton>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "space-between" },
  header: { marginTop: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  selectionContainer: { flex: 1, justifyContent: "center" },
  questionLabel: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  capsuleWrapper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 1 },
  capsuleLabel: { fontSize: 16, fontWeight: "500" },
  footer: { gap: 16, marginBottom: 20 },
  helperText: { textAlign: "center", fontSize: 14, marginBottom: 8 },
});