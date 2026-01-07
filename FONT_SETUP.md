# Custom Font Setup Guide

## How to Add Custom Fonts

### Step 1: Download Font Files
1. Download your desired font files (`.ttf` or `.otf` format)
2. You'll need different files for different weights:
   - Regular (400)
   - Medium (500)
   - SemiBold (600)
   - Bold (700)

### Step 2: Add Fonts to Project
1. Place your font files in `src/assets/fonts/`
2. Example structure:
   ```
   src/assets/fonts/
     - Inter-Regular.ttf
     - Inter-Medium.ttf
     - Inter-SemiBold.ttf
     - Inter-Bold.ttf
   ```

### Step 3: Update Font Configuration
1. Open `src/constants/Fonts.ts`
2. Update the font names to match your font files:
   ```typescript
   export const Fonts = {
     primary: {
       regular: 'Inter-Regular',    // Must match filename (without .ttf)
       medium: 'Inter-Medium',
       semiBold: 'Inter-SemiBold',
       bold: 'Inter-Bold',
     },
   };
   ```

### Step 4: Load Fonts in AppContent
1. Open `src/components/AppContent.tsx`
2. Update the `useFonts` hook:
   ```typescript
   const [loaded] = useFonts({
     'Inter-Regular': require("../assets/fonts/Inter-Regular.ttf"),
     'Inter-Medium': require("../assets/fonts/Inter-Medium.ttf"),
     'Inter-SemiBold': require("../assets/fonts/Inter-SemiBold.ttf"),
     'Inter-Bold': require("../assets/fonts/Inter-Bold.ttf"),
   });
   ```

### Step 5: Restart the App
After adding fonts, restart your Expo development server:
```bash
npx expo start --clear
```

## Recommended Free Fonts

- **Inter** - Modern, clean, highly readable (Google Fonts)
- **Poppins** - Friendly, geometric (Google Fonts)
- **Roboto** - Professional, widely used (Google Fonts)
- **Open Sans** - Clean, versatile (Google Fonts)

## Notes

- Font names must match exactly (case-sensitive)
- On iOS, use the PostScript name if different
- On Android, use the filename without extension
- Font files should be in `.ttf` or `.otf` format
- The app will fall back to system fonts if custom fonts fail to load
