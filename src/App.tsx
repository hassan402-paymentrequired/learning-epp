import 'react-native-reanimated';
import * as React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppUpdateProvider } from './contexts/AppUpdateContext';
import { AppContent } from './components/AppContent';

export function App() {
  return (
    <ThemeProvider>
      <AppUpdateProvider>
        <AppContent />
      </AppUpdateProvider>
    </ThemeProvider>
  );
}
