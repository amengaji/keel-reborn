//keel-mobile/src/navigation/OnboardingNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingIntroScreen from "../screens/onboarding/OnboardingIntroScreen";
import VesselStatusScreen from "../screens/onboarding/VesselStatusScreen";

// ✅ FIXED: Explicitly exporting this type for use in screens
export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  VesselStatus: undefined;
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
    </Stack.Navigator>
  );
}