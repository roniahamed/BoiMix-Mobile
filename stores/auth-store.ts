import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandSecureStorage } from "@/lib/secure-storage";
import { secureStorage, TOKEN_KEYS } from "@/lib/api/client";
import type { AuthUser } from "@/types/user";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setSession: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearSession: () => Promise<void>;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setSession: async (user, accessToken, refreshToken) => {
        // Store tokens in SecureStore (encrypted) — NOT in Zustand persist
        await Promise.all([
          secureStorage.setItem(TOKEN_KEYS.ACCESS, accessToken),
          secureStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken),
        ]);
        set({ user, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearSession: async () => {
        // Clear tokens from SecureStore
        await Promise.all([
          secureStorage.removeItem(TOKEN_KEYS.ACCESS),
          secureStorage.removeItem(TOKEN_KEYS.REFRESH),
        ]);
        set({ user: null, isAuthenticated: false });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-store",
      // Only persist user object (NOT tokens — those live in SecureStore)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      storage: createJSONStorage(() => zustandSecureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
