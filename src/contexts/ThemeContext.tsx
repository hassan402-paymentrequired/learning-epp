import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@app_theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [loaded, setLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        saved &&
        (saved === "light" || saved === "dark" || saved === "auto")
      ) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const toggleTheme = async () => {
    if (themeMode === "auto") {
      await setThemeMode("light");
    } else if (themeMode === "light") {
      await setThemeMode("dark");
    } else {
      await setThemeMode("auto");
    }
  };

  // Determine actual color scheme based on mode
  const colorScheme: "light" | "dark" =
    themeMode === "auto" ? systemColorScheme ?? "light" : themeMode;

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colorScheme,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
