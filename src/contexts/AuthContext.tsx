import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setLogoutCallback } from "../services/api";
import { getAuthToken, setAuthToken, removeAuthToken } from "../services/token-storage";
import {
  registerForExpoPushNotifications,
  syncExpoPushToken,
  unregisterExpoPushNotifications,
} from "../services/expo-push";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  email_verified_at?: string | null;
  subscription_status?: string;
  subscription_expires_at?: string | null;
}

interface PendingSession {
  token: string;
  user: User;
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
    passwordConfirmation: string,
    referralCode?: string
  ) => Promise<PendingSession>;
  activateSession: (token: string, user: User) => Promise<void>;
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
    let isMounted = true;
    loadStoredAuth(isMounted);

    // Register logout callback for API interceptor
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    setLogoutCallback(handleLogout);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      setLogoutCallback(() => { });
    };
  }, []);

  const loadStoredAuth = async (isMounted: boolean) => {
    try {
      const storedToken = await getAuthToken();
      const [storedUser, onboardingStatus] = await AsyncStorage.multiGet([
        "user",
        "hasSeenOnboarding",
      ]);

      if (isMounted) {
        setHasSeenOnboardingState(onboardingStatus[1] === "true");
      }

      if (storedToken && storedUser[1]) {
        let parsedUser: User | null = null;
        try {
          parsedUser = JSON.parse(storedUser[1]) as User;
        } catch {
          await removeAuthToken();
          await AsyncStorage.removeItem("user");
        }

        if (!parsedUser) {
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          setUser(parsedUser);
        }

        // Verify token is still valid
        try {
          await api.get("/me");
          void syncExpoPushToken().catch(() => {});
        } catch (error) {
          // Token invalid, clear storage
          await removeAuthToken();
          await AsyncStorage.removeItem("user");
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
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
      if (!newToken || !userData) {
        throw new Error("Invalid login response. Please try again.");
      }

      await setAuthToken(newToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      void registerForExpoPushNotifications().catch(() => {});
    } catch (error: any) {
      if (error.response?.data) {
        const customError: any = new Error(
          error.response.data.message || "Login failed. Please try again."
        );
        customError.response = error.response;
        throw customError;
      }
      // Keep Axios errors as-is so callers see ERR_NETWORK / ECONNABORTED and optional `response`
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    referralCode?: string
  ): Promise<PendingSession> => {
    try {
      const response = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        referral_code: referralCode,
      });
      const { token: newToken, user: userData } = response.data.data;
      if (!newToken || !userData) {
        throw new Error("Invalid registration response. Please try again.");
      }

      await setAuthToken(newToken);

      return { token: newToken, user: userData };
    } catch (error: any) {
      if (error.response?.data?.message) {
        const err: any = new Error(error.response.data.message);
        err.response = error.response;
        throw err;
      }
      throw error;
    }
  };

  const activateSession = async (token: string, user: User) => {
    await setAuthToken(token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    void registerForExpoPushNotifications().catch(() => {});
  };

  const logout = async () => {
    try {
      try {
        await unregisterExpoPushNotifications();
      } catch {
        // Best-effort token cleanup before session ends.
      }
      if (token) {
        await api.post("/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await removeAuthToken();
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/me");
      const userData = response.data.data.user;
      if (!userData) {
        throw new Error("Invalid user profile response");
      }
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
        activateSession,
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
