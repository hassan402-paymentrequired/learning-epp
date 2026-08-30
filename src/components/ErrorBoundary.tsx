import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <View style={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Something went wrong
            </ThemedText>
            <ThemedText style={styles.message}>
              Stepra ran into an unexpected error. Please try again.
            </ThemedText>
          </View>
          <View style={styles.actions}>
            <Button title="Try again" onPress={this.handleReset} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 54,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginTop: 120,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
    alignSelf: 'center',
  },
});
