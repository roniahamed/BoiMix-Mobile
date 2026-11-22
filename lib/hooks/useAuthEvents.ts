import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { authEventEmitter } from "@/lib/api/client";
import { queryClient } from "@/providers/QueryProvider";

/**
 * Listens for global auth events (e.g., 401 token refresh failure)
 * and clears session + query cache when logout is triggered.
 */
export function useAuthEvents() {
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    const unsubscribe = authEventEmitter.on("logout", () => {
      clearSession();
      queryClient.clear();
    });

    return unsubscribe;
  }, [clearSession]);
}
