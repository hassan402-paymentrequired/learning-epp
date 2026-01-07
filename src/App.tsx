import 'react-native-reanimated';
import * as React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppContent } from './components/AppContent';

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
