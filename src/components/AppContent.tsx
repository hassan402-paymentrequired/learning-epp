import React from "react";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ExamSelectionProvider } from "@/contexts/ExamSelectionContext";
import { Navigation } from "@/navigation";

SplashScreen.preventAutoHideAsync();

export function AppContent() {
  const { colorScheme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  const theme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: Colors[colorScheme ?? "light"].tint,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: Colors[colorScheme ?? "light"].tint,
          },
        };

  return (
    <AuthProvider>
      <ExamSelectionProvider>
        <Navigation
          theme={theme}
          linking={{
            enabled: "auto",
            prefixes: ["helloworld://"],
          }}
          onReady={() => {
            SplashScreen.hideAsync();
          }}
        />
      </ExamSelectionProvider>
    </AuthProvider>
  );
}
