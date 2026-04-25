import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StatusBar } from "react-native";

import { Home } from "@/screens/Home";
import { NotFound } from "./screens/NotFound";
import { Onboarding } from "@/screens/Onboarding";
import { Login } from "@/screens/auth/Login";
import { Signup } from "@/screens/auth/Signup";
import { EmailVerification } from "@/screens/auth/EmailVerification";
import { ForgotPassword } from "@/screens/auth/ForgotPassword";
import { VerifyResetOtp } from "@/screens/auth/VerifyResetOtp";
import { ResetPassword } from "@/screens/auth/ResetPassword";
import { EditProfile } from "@/screens/EditProfile";
import { Profile } from "@/screens/Profile";
import { SubjectSelection } from "@/screens/exam/SubjectSelection";
import { QuestionModeSelection } from "@/screens/exam/QuestionModeSelection";
import { YearSelection } from "@/screens/exam/YearSelection";
import { TimeSelection } from "@/screens/exam/TimeSelection";
import { ExamScreen } from "@/screens/exam/ExamScreen";
// Standard generic category screens
import { StandardModeSelection } from "@/screens/exam/standard/ModeSelection";
import { StandardPastQuestionsSelection } from "@/screens/exam/standard/PastQuestionsSelection";
import { StandardPracticeQuestionsSelection } from "@/screens/exam/standard/PracticeQuestionsSelection";
// DLI screens
import { DLIPracticeSelection } from "@/screens/exam/dli/PracticeSelection";
// Unilag/Department flow
import { DepartmentsList } from "@/screens/unilag/DepartmentsList";
import { DepartmentSubjects } from "@/screens/unilag/DepartmentSubjects";
import { ExamResults } from "@/screens/exam/ExamResults";
import { CorrectionsScreen } from "@/screens/exam/CorrectionsScreen";
import { Leaderboard } from "@/screens/Leaderboard";
import { Subscription } from "@/screens/Subscription";
import { Referral } from "@/screens/Referral";
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
      <AuthStack.Screen name="EmailVerification" component={EmailVerification} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="VerifyResetOtp" component={VerifyResetOtp} />
      <AuthStack.Screen name="ResetPassword" component={ResetPassword} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={Home} />
      <AppStack.Screen name="Profile" component={Profile} />
      {/* Standard screens */}
      <AppStack.Screen name="StandardModeSelection" component={StandardModeSelection} />
      <AppStack.Screen name="StandardPastQuestionsSelection" component={StandardPastQuestionsSelection} />
      <AppStack.Screen name="StandardPracticeQuestionsSelection" component={StandardPracticeQuestionsSelection} />
      {/* DLI / Unilag screens */}
      <AppStack.Screen name="DepartmentsList" component={DepartmentsList} />
      <AppStack.Screen name="DepartmentSubjects" component={DepartmentSubjects} />
      <AppStack.Screen name="DLIPracticeSelection" component={DLIPracticeSelection} />
      {/* Legacy screens (kept for backward compatibility, can be removed later) */}
      <AppStack.Screen
        name="QuestionModeSelection"
        component={QuestionModeSelection}
      />
      <AppStack.Screen name="SubjectSelection" component={SubjectSelection} />
      <AppStack.Screen name="YearSelection" component={YearSelection} />
      <AppStack.Screen name="TimeSelection" component={TimeSelection} />
      <AppStack.Screen name="ExamScreen" component={ExamScreen} />
      <AppStack.Screen name="ExamResults" component={ExamResults} />
      <AppStack.Screen name="CorrectionsScreen" component={CorrectionsScreen} />
      <AppStack.Screen name="Leaderboard" component={Leaderboard} />
      <AppStack.Screen name="Subscription" component={Subscription} />
      <AppStack.Screen name="Referral" component={Referral} />
      <AppStack.Screen name="EditProfile" component={EditProfile} />
      <AppStack.Screen name="NotFound" component={NotFound} />
    </AppStack.Navigator>
  );
}

export function Navigation({ theme, linking, onReady }: any) {
  const { isAuthenticated, isLoading, hasSeenOnboarding, user } = useAuth();

  // Email verified check: null means not verified
  const emailVerified = !!user?.email_verified_at;

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
        {isAuthenticated && emailVerified ? (
          <AppNavigator />
        ) : isAuthenticated && !emailVerified ? (
          // Authenticated but email not verified — lock to verification screen
          // Using a minimal stack so the user cannot navigate away
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen
              name="EmailVerification"
              component={EmailVerification}
              initialParams={{ email: user?.email }}
            />
          </AuthStack.Navigator>
        ) : hasSeenOnboarding ? (
          <AuthNavigator />
        ) : (
          <OnboardingNavigator />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
}
