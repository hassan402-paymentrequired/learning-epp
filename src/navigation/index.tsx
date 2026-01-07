import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StatusBar } from "react-native";

import { Home } from "@/screens/Home";
import { NotFound } from "./screens/NotFound";
import { Onboarding } from "@/screens/Onboarding";
import { Login } from "@/screens/auth/Login";
import { Signup } from "@/screens/auth/Signup";
import { Profile } from "@/screens/Profile";
import { SubjectSelection } from "@/screens/exam/SubjectSelection";
import { QuestionModeSelection } from "@/screens/exam/QuestionModeSelection";
import { QuestionCountSelection } from "@/screens/exam/QuestionCountSelection";
import { TimeSelection } from "@/screens/exam/TimeSelection";
import { ExamScreen } from "@/screens/exam/ExamScreen";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { ThemedView } from "@/components/ThemedView";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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
      <AppStack.Screen name="Home" component={Home} />
      <AppStack.Screen name="Profile" component={Profile} />
      <AppStack.Screen name="SubjectSelection" component={SubjectSelection} />
      <AppStack.Screen
        name="QuestionModeSelection"
        component={QuestionModeSelection}
      />
      <AppStack.Screen
        name="QuestionCountSelection"
        component={QuestionCountSelection}
      />
      <AppStack.Screen name="TimeSelection" component={TimeSelection} />
      <AppStack.Screen name="ExamScreen" component={ExamScreen} />
      <AppStack.Screen name="NotFound" component={NotFound} />
    </AppStack.Navigator>
  );
}

export function Navigation({ theme, linking, onReady }: any) {
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useAuth();

  if (isLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />
      <NavigationContainer theme={theme} linking={linking} onReady={onReady}>
        {isAuthenticated ? (
          <AppNavigator />
        ) : hasSeenOnboarding ? (
          <AuthNavigator />
        ) : (
          <OnboardingNavigator />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
}
