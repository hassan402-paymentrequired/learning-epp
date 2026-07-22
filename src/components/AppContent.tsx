import React, { useCallback, useEffect, useRef } from "react";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ExamSelectionProvider } from "@/contexts/ExamSelectionContext";
import { CustomSplashScreen } from "@/components/CustomSplashScreen";
import { Navigation } from "@/navigation";

const SPLASH_FALLBACK_MS = 8000;

export function AppContent() {
  const { colorScheme } = useTheme();
  const splashHiddenRef = useRef(false);
  const [loaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const hideSplash = useCallback(() => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Safety net: never leave the native splash stuck if onReady never fires.
  useEffect(() => {
    const timeout = setTimeout(hideSplash, SPLASH_FALLBACK_MS);
    return () => clearTimeout(timeout);
  }, [hideSplash]);

  if (!loaded && !fontError) {
    return <CustomSplashScreen />;
  }

  const palette = Colors[colorScheme ?? "light"];
  const theme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          dark: true,
          colors: {
            ...DarkTheme.colors,
            primary: palette.tint,
            background: palette.background,
            card: palette.card,
            text: palette.text,
            border: palette.border,
            notification: palette.tint,
          },
        }
      : {
          ...DefaultTheme,
          dark: false,
          colors: {
            ...DefaultTheme.colors,
            primary: palette.tint,
            background: palette.background,
            card: palette.card,
            text: palette.text,
            border: palette.border,
            notification: palette.tint,
          },
        };

  return (
    <AuthProvider>
      <ExamSelectionProvider>
        <Navigation
          theme={theme}
          linking={{
            enabled: "auto",
            prefixes: ["stepra://"],
            config: {
              screens: {
                Subscription: {
                  path: "subscription/callback",
                  parse: {
                    reference: (reference: string) => reference,
                  },
                },
              },
            },
          }}
          onReady={hideSplash}
        />
      </ExamSelectionProvider>
    </AuthProvider>
  );
}
