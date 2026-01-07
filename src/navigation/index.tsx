import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, ActivityIndicator } from 'react-native';

import { Explore } from './screens/Explore';
import { Home } from '@/screens/Home';
import { NotFound } from './screens/NotFound';
import { Onboarding } from '@/screens/Onboarding';
import { Login } from '@/screens/auth/Login';
import { Signup } from '@/screens/auth/Signup';
import { Profile } from '@/screens/Profile';
import { ExamTypeSelection } from '@/screens/exam/ExamTypeSelection';
import { SubjectSelection } from '@/screens/exam/SubjectSelection';
import { QuestionModeSelection } from '@/screens/exam/QuestionModeSelection';
import { QuestionCountSelection } from '@/screens/exam/QuestionCountSelection';
import { TimeSelection } from '@/screens/exam/TimeSelection';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/ThemedView';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={Explore}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Onboarding" component={Onboarding} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
    </RootStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Signup" component={Signup} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="HomeTabs" component={HomeTabs} />
      <AppStack.Screen name="SubjectSelection" component={SubjectSelection} />
      <AppStack.Screen name="QuestionModeSelection" component={QuestionModeSelection} />
      <AppStack.Screen name="QuestionCountSelection" component={QuestionCountSelection} />
      <AppStack.Screen name="TimeSelection" component={TimeSelection} />
      <AppStack.Screen name="NotFound" component={NotFound} />
    </AppStack.Navigator>
  );
}

export function Navigation({ theme, linking, onReady }: any) {
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <NavigationContainer theme={theme} linking={linking} onReady={onReady}>
      {isAuthenticated ? (
        <AppNavigator />
      ) : hasSeenOnboarding ? (
        <AuthNavigator />
      ) : (
        <OnboardingNavigator />
      )}
    </NavigationContainer>
  );
}
