//keel-mobile/src/navigation/OnboardingNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingIntroScreen from "../screens/OnboardingIntroScreen";

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="OnboardingIntro"
        component={OnboardingIntroScreen}
      />
    </Stack.Navigator>
  );
}
