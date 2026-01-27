//keel-mobile/src/navigation/BottomTabNavigator.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ FIXED: Screens are now in 'main' deck
import HomeScreen from "../screens/main/HomeScreen";
// ✅ FIXED: Screens are now in 'sea-service' deck
import SeaServiceScreen from "../screens/sea-service/SeaServiceScreen";
// ✅ FIXED: Screens are now in 'tasks' deck
import TaskListScreen from "../screens/tasks/TaskListScreen";
// ✅ FIXED: Screens are now in 'daily' deck
import DailyScreen from "../screens/daily/DailyLogScreen";
// ✅ FIXED: Screens are now in 'profile' deck
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
// ✅ FIXED: Screens are now in 'tasks' deck
import TasksHomeScreen from "../screens/tasks/TasksHomeScreen";

import TaskSectionScreen from "../screens/tasks/TaskSectionScreen";
// ✅ FIXED: Moved to 'tasks' folder
import TaskDetailsScreen from "../screens/tasks/TaskDetailsScreen";
// ✅ FIXED: Moved to 'vessel' folder


const Tab = createBottomTabNavigator();

/**
 * ============================================================
 * Home Tab Stack Types (LOCAL)
 * ============================================================
 * * PURPOSE:
 * - Allows navigation to Vessel Particulars while keeping
 * the bottom tabs visible (Nested Navigation).
 */
type HomeStackParamList = {
  HomeRoot: undefined;
  VesselParticulars: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      {/* The Dashboard */}
      <HomeStack.Screen name="HomeRoot" component={HomeScreen} />
      

    </HomeStack.Navigator>
  );
}

/**
 * ============================================================
 * Tasks Tab Stack Types (LOCAL)
 * ============================================================
 *
 * WHY LOCAL TYPES:
 * - These screens live INSIDE the Tasks tab
 * - They must still accept the same route params
 * - Keeps TS happy without rewriting the global navigation types yet
 */
type TasksStackParamList = {
  TasksHome: undefined;
  TaskSection: {
    sectionKey: string;
    sectionTitle: string;
  };
  TaskDetails: {
    taskKey: string;
  };
};


/**
 * ============================================================
 * Tasks Stack Navigator
 * ============================================================
 *
 * PURPOSE:
 * - Keep bottom tabs visible during task drill-down
 * - Provide clean task-specific navigation
 * - Avoid footer / safe-area hacks
 */
const TasksStack = createNativeStackNavigator<TasksStackParamList>();

function TasksStackNavigator() {
  return (
    <TasksStack.Navigator screenOptions={{ headerShown: false }}>
      <TasksStack.Screen
        name="TasksHome"
        component={TasksHomeScreen}
      />

      <TasksStack.Screen
        name="TaskSection"
        component={TaskSectionScreen}
      />

      <TasksStack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
      />
    </TasksStack.Navigator>
  );
}





export default function BottomTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="SeaService"
        component={SeaServiceScreen}
        options={{
          title: "Sea Service",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="ship-wheel"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-text"
              color={color}
              size={size}
            />
          ),
        }}
      />


      <Tab.Screen
        name="Daily"
        component={DailyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-check"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cog"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}