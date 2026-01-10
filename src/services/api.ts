import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your Laravel API URL
// For Android emulator, use: http://10.0.2.2:8000/api
// For iOS simulator, use: http://localhost:8000/api
// For physical device, use your computer's IP: http://YOUR_IP:8000/api
const API_BASE_URL = __DEV__
  ? 'https://1a55a40c4de1.ngrok-free.app/api'   // iOS simulator
  : 'https://your-api-domain.com/api'; // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Track refresh state to prevent loops
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}[] = [];

// Callback for logout - will be set by AuthContext
let onLogoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  onLogoutCallback = callback;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      url?: string;
    };

    // Skip refresh logic for auth endpoints
    const isAuthEndpoint =
      originalRequest?.url?.includes('/login') ||
      originalRequest?.url?.includes('/register');

    // If this is a refresh request that failed, don't retry - logout user immediately
    if (originalRequest?.url?.includes('/refresh') && error.response?.status === 401) {
      isRefreshing = false;
      processQueue(error);
      await AsyncStorage.multiRemove(['auth_token', 'user']);

      // Trigger logout callback
      if (onLogoutCallback) {
        onLogoutCallback();
      }

      return Promise.reject({
        ...error,
        isAuthError: true,
        message: 'Session expired. Please login again.',
      });
    }

    // Skip if is auth endpoint
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If token expired and we haven't retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentToken = await AsyncStorage.getItem('auth_token');
        if (!currentToken) {
          throw new Error('No token found');
        }

        // Create a separate axios instance for refresh to avoid interceptor loops
        const refreshApi = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
        });

        // Make refresh request - this won't trigger interceptors since it's a new instance
        const refreshResponse = await refreshApi.post('/refresh');

        if (refreshResponse.data.success && refreshResponse.data.data?.token) {
          const newToken = refreshResponse.data.data.token;
          await AsyncStorage.setItem('auth_token', newToken);

          // Process queued requests
          processQueue(null, newToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (refreshError: any) {
        // Refresh failed, clear tokens and process queue with error
        processQueue(refreshError);

        await AsyncStorage.multiRemove(['auth_token', 'user']);

        // Trigger logout callback
        if (onLogoutCallback) {
          onLogoutCallback();
        }

        // Return a specific error that can be handled
        return Promise.reject({
          ...refreshError,
          isAuthError: true,
          message: 'Session expired. Please login again.',
        });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
