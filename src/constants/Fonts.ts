/**
 * Primary UI font: Inter from @expo-google-fonts/inter
 * Internal names must match what useFonts registers in AppContent.tsx
 */

export const Fonts = {
  primary: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  secondary: {
    regular: "SpaceMono",
  },
} as const;

// Default font family to use throughout the app
export const DEFAULT_FONT_FAMILY = Fonts.primary.regular;
