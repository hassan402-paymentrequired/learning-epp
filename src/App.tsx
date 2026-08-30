import 'react-native-reanimated';
import * as React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppUpdateProvider } from './contexts/AppUpdateContext';
import { AppContent } from './components/AppContent';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppUpdateProvider>
          <AppContent />
        </AppUpdateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
