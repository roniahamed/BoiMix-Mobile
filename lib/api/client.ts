import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/constants/env";
import { secureStorage } from "@/lib/secure-storage";
export { secureStorage };

// Keys used to store tokens in SecureStore
export const TOKEN_KEYS = {
  ACCESS: "auth_access_token",
  REFRESH: "auth_refresh_token",
} as const;

const apiClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach access token to every request (except auth endpoints)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/token/refresh");

    if (!isAuthEndpoint) {
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
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post<{ access: string; refresh: string }>(
          `${ENV.apiBaseUrl}/auth/token/refresh/`,
          { refresh: refreshToken },
        );

        await secureStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
        if (data.refresh) {
          await secureStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens and trigger logout
        await secureStorage.removeItem(TOKEN_KEYS.ACCESS);
        await secureStorage.removeItem(TOKEN_KEYS.REFRESH);
        // AuthStore.clearSession() will be called by the auth store listener
        // Emit a global event that the app can listen to
        authEventEmitter.emit("logout");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Simple event emitter for auth events
class SimpleEventEmitter {
  private listeners: Record<string, Array<() => void>> = {};

  emit(event: string) {
    this.listeners[event]?.forEach((cb) => cb());
  }

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: () => void) {
    this.listeners[event] = this.listeners[event]?.filter((cb) => cb !== callback) ?? [];
  }
}

export const authEventEmitter = new SimpleEventEmitter();
export default apiClient;
