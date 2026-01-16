//keel-mobile/App.tsx

import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { PaperProvider, Appbar, useTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, ClipboardCheck, Ship, User, Clock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { LightTheme, DarkTheme } from './src/theme/AppTheme';
import { HomeScreen } from './src/screens/HomeScreen';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { LogPositionScreen } from './src/screens/LogPositionScreen';
import { WatchEntryScreen } from './src/screens/WatchEntryScreen';
import { VesselParticularsScreen } from './src/screens/VesselParticularsScreen';
import { SafetyMapScreen } from './src/screens/SafetyMapScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

/**
 * CUSTOM HEADER COMPONENT
 */
const CustomHeader = ({ title, navigation, back }: any) => {
  const theme = useTheme();
  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
      {back ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
      <Appbar.Content 
        title={title} 
        titleStyle={{ fontWeight: '800', color: theme.colors.primary, fontSize: 18 }} 
      />
      <Appbar.Action icon="bell-outline" onPress={() => {}} />
    </Appbar.Header>
  );
};

/**
 * MAIN TAB NAVIGATOR
 * This holds the primary navigation of the app.
 */
function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === 'android' ? 70 + insets.bottom : 88;

  return (
    <Tab.Navigator
      id="TraineeMainTabs"
      screenOptions={({ route }) => ({
        header: (props) => <CustomHeader {...props} title={route.name} />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: { 
          backgroundColor: theme.colors.surface, 
          height: TAB_BAR_HEIGHT,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 8 : insets.bottom,
        },
        tabBarLabelStyle: { 
          fontWeight: '700', 
          fontSize: 10, 
          marginBottom: Platform.OS === 'android' ? 5 : 0 
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Watch" 
        component={WatchEntryScreen}
        options={{ 
          tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
          title: "Watch Log" 
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TaskListScreen}
        options={{ tabBarIcon: ({ color }) => <ClipboardCheck color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Vessel" 
        component={VesselParticularsScreen} 
        options={{ tabBarIcon: ({ color }) => <Ship color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}

/**
 * NAVIGATION ROOT
 * Uses a Root Stack to allow navigation to full-screen modals/flows
 * from ANY tab (essential for the Ship Familiarization flow).
 */
function NavigationRoot() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <NavigationContainer theme={theme as any}>
      <RootStack.Navigator id="RootNavigator" screenOptions={{ headerShown: false }}>
        {/* Main App with Bottom Tabs */}
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Global Screens (Accessible from any tab) */}
        <RootStack.Screen 
          name="SafetyMap" 
          component={SafetyMapScreen} 
          options={{ 
            headerShown: true, 
            header: (props) => <CustomHeader {...props} title="Safety Walkthrough" back /> 
          }} 
        />
        <RootStack.Screen 
          name="LogPosition" 
          component={LogPositionScreen} 
          options={{ 
            headerShown: true, 
            header: (props) => <CustomHeader {...props} title="Log GPS Position" back /> 
          }}
        />
        <RootStack.Screen 
          name="WatchEntry" 
          component={WatchEntryScreen} 
          options={{ 
            headerShown: true, 
            header: (props) => <CustomHeader {...props} title="Watch Log Entry" back /> 
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationRoot />
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}