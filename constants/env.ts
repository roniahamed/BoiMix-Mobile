const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `http://${host}:8080/api/v1`;
    }
  }
  return (
    (process.env.EXPO_PUBLIC_API_BASE_URL as string) ??
    "http://127.0.0.1:8080/api/v1"
  );
};

const getWsBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `ws://${host}:8001`;
    }
  }
  return (
    (process.env.EXPO_PUBLIC_WS_BASE_URL as string) ?? "ws://127.0.0.1:8001"
  );
};

export const ENV = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  get wsBaseUrl() {
    return getWsBaseUrl();
  },
  environment:
    (process.env.EXPO_PUBLIC_ENV as string) ?? "development",
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string,
  },
  isDev: process.env.EXPO_PUBLIC_ENV !== "production",
} as const;
