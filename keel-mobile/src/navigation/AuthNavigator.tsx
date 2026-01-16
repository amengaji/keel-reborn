//keel-mobile/src/navigation/AuthNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { hasSeenWelcome } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenWelcome ? "Login" : "Welcome"}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
