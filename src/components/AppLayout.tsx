import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showHeader?: boolean;
  headerTitle?: string;
  showBackButton?: boolean;
}

export function AppLayout({ 
  children, 
  style, 
  showHeader = true,
  headerTitle,
  showBackButton = false,
}: AppLayoutProps) {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      {showHeader && (
        <AppHeader title={headerTitle} showBackButton={showBackButton} />
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
