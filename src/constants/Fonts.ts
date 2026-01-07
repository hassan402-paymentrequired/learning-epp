/**
 * Font configuration for the app
 * 
 * To use custom fonts:
 * 1. Add your font files (.ttf or .otf) to src/assets/fonts/
 * 2. Update the font names below to match your font files
 * 3. Load them in AppContent.tsx using useFonts
 * 
 * Example font names (replace with your actual font):
 * - 'Inter-Regular' for Inter-Regular.ttf
 * - 'Inter-Bold' for Inter-Bold.ttf
 * - 'Poppins-Regular' for Poppins-Regular.ttf
 */

export const Fonts = {
  // Primary font family (used for most text)
  primary: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  // Secondary font family (optional, for headings or special text)
  secondary: {
    regular: 'SpaceMono',
  },
} as const;

// Default font family to use throughout the app
export const DEFAULT_FONT_FAMILY = Fonts.primary.regular;
