import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { ENV } from "@/constants/env";
import { API_ENDPOINTS } from "@/constants/api";
import { secureStorage } from "@/lib/secure-storage";
export { secureStorage };

// Keys used to store tokens in SecureStore
export const TOKEN_KEYS = {
  ACCESS: "auth_access_token",
  REFRESH: "auth_refresh_token",
} as const;

type AuthEventCallback = () => void;
class AuthEventEmitter {
  private listeners: { [event: string]: AuthEventCallback[] } = {};

  on(event: string, callback: AuthEventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((cb) => cb !== callback);
    };
  }

  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb());
    }
  }
}

export const authEventEmitter = new AuthEventEmitter();

const apiClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Platform": Platform.OS,
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach access token to every request (except public auth endpoints)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = ENV.apiBaseUrl;
    const isPublicAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/otp") ||
      config.url?.includes("/auth/forgot-password") ||
      config.url?.includes("/auth/reset-password") ||
      config.url?.includes("/auth/refresh");

    if (!isPublicAuthEndpoint) {
      const token = await secureStorage.getItem(TOKEN_KEYS.ACCESS);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// On 401: try to refresh token once, then logout if refresh fails
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getItem(TOKEN_KEYS.REFRESH);
        if (!refreshToken) throw new Error("No refresh token available");

        const { data } = await axios.post<{ access_token: string; refresh_token?: string }>(
          `${ENV.apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh_token: refreshToken },
        );

        const newAccessToken = data.access_token;
        await secureStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
        if (data.refresh_token) {
          await secureStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh_token);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear stored tokens on failure
        await Promise.all([
          secureStorage.removeItem(TOKEN_KEYS.ACCESS),
          secureStorage.removeItem(TOKEN_KEYS.REFRESH),
        ]);
        authEventEmitter.emit("logout");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
