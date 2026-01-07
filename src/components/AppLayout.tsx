import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  headerRight?: React.ReactNode;
}

export function AppLayout({
  children,
  showHeader = false,
  headerTitle,
  headerRight,
}: AppLayoutProps) {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
      />
      <ThemedView style={styles.content}>
        {showHeader && (
          <View style={styles.header}>
            {headerTitle && (
              <View style={styles.headerContent}>
                {/* Header content can be added here */}
              </View>
            )}
            {headerRight && <View>{headerRight}</View>}
          </View>
        )}
        <View style={styles.body}>{children}</View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
