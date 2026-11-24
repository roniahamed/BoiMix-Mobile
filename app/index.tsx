import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { secureStorage, TOKEN_KEYS } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { Colors } from "@/constants/theme";

/**
 * Splash / Entry Screen
 *
 * Flow:
 * 1. Wait for Zustand store to hydrate (secureStore async)
 * 2. Check if access token exists in SecureStore
 * 3. If yes → validate by calling GET /me/profile
 *    - Success → go to (tabs)/
 *    - 401 → token refresh handled by interceptor → if still 401 → go to auth/login
 * 4. If no token → go to auth/login (or onboarding on first launch)
 */
export default function SplashScreen() {
  const router = useRouter();
  const { isHydrated, clearSession } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    async function checkAuth() {
      try {
        const token = await secureStorage.getItem(TOKEN_KEYS.ACCESS);

        if (!token) {
          router.replace("/tabs");
          return;
        }

        // Validate token by fetching profile
        const response = await authApi.getProfile();
        const user = response.data;

        if (user) {
          // Token is valid — keep session, navigate to app
          router.replace("/tabs");
        } else {
          await clearSession();
          router.replace("/tabs");
        }
      } catch {
        // 401 handled by interceptor (refresh attempted)
        // If we still get here, tokens are invalid
        await clearSession();
        router.replace("/tabs");
      }
    }

    checkAuth();
  }, [isHydrated, clearSession, router]);

  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <ActivityIndicator size="large" color={Colors.textInverse} />
    </View>
  );
}
