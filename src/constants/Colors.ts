/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#6366F1'; // Purple/indigo for primary actions
const tintColorDark = '#818CF8';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    inputBackground: '#F9FAFB',
    placeholder: '#9CA3AF',
    error: '#EF4444',
    success: '#10B981',
    gradientStart: '#E0E7FF',
    gradientEnd: '#F3F4F6',
    card: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    backgroundSecondary: '#1A1A1A',
    tint: '#818CF8',
    icon: '#FFFFFF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#818CF8',
    border: '#2A2A2A',
    inputBackground: '#1A1A1A',
    placeholder: '#666666',
    error: '#F87171',
    success: '#34D399',
    gradientStart: '#1A1A1A',
    gradientEnd: '#000000',
    card: '#1A1A1A',
  },
};
