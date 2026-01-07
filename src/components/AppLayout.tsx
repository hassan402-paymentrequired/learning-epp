import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AppLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AppLayout({ children, style }: AppLayoutProps) {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
