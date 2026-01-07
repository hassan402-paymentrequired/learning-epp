import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showHeader?: boolean;
  headerTitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function AppLayout({
  children,
  style,
  showHeader = true,
  headerTitle,
  showBackButton = false,
  onBackPress,
}: AppLayoutProps) {
  const backgroundColor = useThemeColor({}, "background");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      {showHeader && (
        <AppHeader title={headerTitle} showBackButton={showBackButton} onBackPress={onBackPress} />
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
