//keel-mobile/src/navigation/OnboardingNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingIntroScreen from "../screens/onboarding/OnboardingIntroScreen";
import VesselStatusScreen from "../screens/onboarding/VesselStatusScreen";
// ✅ NEW: Import the new screen
import VesselDetailsScreen from "../screens/onboarding/VesselDetailsScreen";

// ✅ ADDED: Type definition for the new screen
export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  VesselStatus: undefined;
  VesselDetails: undefined; // New Route
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OnboardingIntro"
        component={OnboardingIntroScreen}
      />
      <Stack.Screen 
        name="VesselStatus" 
        component={VesselStatusScreen} 
      />
      {/* ✅ NEW: Added the route */}
      <Stack.Screen 
        name="VesselDetails" 
        component={VesselDetailsScreen} 
      />
    </Stack.Navigator>
  );
}