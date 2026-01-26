//keel-mobile/src/screens/onboarding/VesselStatusScreen.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper"; // ✅ CORRECT: Dynamic Theme Hook

// Custom Components
// ✅ We import the named export exactly as it appears in your file
import { KeelButton } from "../../components/ui/KeelButton";
import YesNoCapsule from "../../components/common/YesNoCapsule";
import { useAuth } from "../../auth/AuthContext";

// Types
import { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";

// Define navigation prop type for safety
type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "VesselStatus">;

export default function VesselStatusScreen() {
  const navigation = useNavigation<NavigationProp>();
  // ✅ This uses the correct hook to get colors (Light/Dark safe)
  const theme = useTheme();
  
  // Connect to Auth Context for the 'setOnboardingCompleted' function
  const { setOnboardingCompleted } = useAuth(); 

  // State to track if the cadet is onboard (default to false/shore)
  const [isOnboard, setIsOnboard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle the Next Step
   * Logic:
   * - If Shore (No): Mark onboarding complete, go to Home (Shore Dashboard).
   * - If Ship (Yes): In future, this goes to "Vessel Particulars". 
   * For now, we mark complete to unblock the flow.
   */
  const handleContinue = async () => {
    setIsSubmitting(true);
    
    // Simulate API call or processing delay
    setTimeout(() => {
      // If user selected YES, we would normally navigate to Vessel Details.
      // For this step, we will just complete onboarding to unblock the flow.
      setOnboardingCompleted(true);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Current Status
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            To customize your experience, tell us where you are currently located.
          </Text>
        </View>

        {/* Selection Section */}
        <View style={styles.selectionContainer}>
          <Text style={[styles.questionLabel, { color: theme.colors.onBackground }]}>
            Are you currently onboard a vessel?
          </Text>
          
          {/* Custom Capsule Component Wrapper */}
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
            
            {/* ✅ Reuse existing Capsule component
               Note: We handle the label outside because the Capsule 
               component itself might not support custom labels perfectly in this layout.
            */}
            <YesNoCapsule 
              value={isOnboard} 
              onChange={setIsOnboard} 
            />
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.footer}>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            {isOnboard 
              ? "We'll set up your Sea Service and Watchkeeping logs next."
              : "We'll take you to your shore training dashboard."}
          </Text>
          
          {/* ✅ FIXED: Correct props for your KeelButton */}
          <KeelButton 
            mode="primary"
            onPress={handleContinue}
            loading={isSubmitting}
          >
            {isOnboard ? "Continue to Vessel Setup" : "Go to Dashboard"}
          </KeelButton>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24, // Standard spacing
    justifyContent: "space-between",
  },
  header: {
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: "center",
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  capsuleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  capsuleLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    gap: 16,
    marginBottom: 20,
  },
  helperText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 8,
  },
});