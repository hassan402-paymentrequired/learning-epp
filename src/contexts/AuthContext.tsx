import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setLogoutCallback } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);

  useEffect(() => {
    loadStoredAuth();

    // Register logout callback for API interceptor
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    setLogoutCallback(handleLogout);

    // Cleanup on unmount
    return () => {
      setLogoutCallback(() => {});
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, onboardingStatus] =
        await AsyncStorage.multiGet([
          "auth_token",
          "user",
          "hasSeenOnboarding",
        ]);

      setHasSeenOnboardingState(onboardingStatus[1] === "true");

      if (storedToken[1] && storedUser[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(storedUser[1]));

        // Verify token is still valid
        try {
          await api.get("/me");
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.multiRemove(["auth_token", "user"]);
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setHasSeenOnboarding = async (value: boolean) => {
    await AsyncStorage.setItem("hasSeenOnboarding", value.toString());
    setHasSeenOnboardingState(value);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/login", { email, password });
      const { token: newToken, user: userData } = response.data.data;

      await AsyncStorage.multiSet([
        ["auth_token", newToken],
        ["user", JSON.stringify(userData)],
      ]);

      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      throw new Error(message);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    try {
      const response = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      const { token: newToken, user: userData } = response.data.data;

      await AsyncStorage.multiSet([
        ["auth_token", newToken],
        ["user", JSON.stringify(userData)],
      ]);

      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.multiRemove(["auth_token", "user"]);
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/me");
      const userData = response.data.data.user;
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        hasSeenOnboarding,
        setHasSeenOnboarding,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
