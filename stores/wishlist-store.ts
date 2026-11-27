import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type WishlistState = {
  bookIds: Set<string>;
  scopeId: string | null;
  syncPending: boolean;
  syncError: boolean;

  addBook: (bookId: string) => void;
  removeBook: (bookId: string) => void;
  toggleBook: (bookId: string) => void;
  isWishlisted: (bookId: string) => boolean;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      bookIds: new Set<string>(),
      scopeId: null,
      syncPending: false,
      syncError: false,

      addBook: (bookId) =>
        set((state) => ({ bookIds: new Set([...state.bookIds, bookId]) })),

      removeBook: (bookId) =>
        set((state) => {
          const next = new Set(state.bookIds);
          next.delete(bookId);
          return { bookIds: next };
        }),

      toggleBook: (bookId) => {
        const { isWishlisted, addBook, removeBook } = get();
        isWishlisted(bookId) ? removeBook(bookId) : addBook(bookId);
      },

      isWishlisted: (bookId) => get().bookIds.has(bookId),

      clearWishlist: () => set({ bookIds: new Set() }),
    }),
    {
      name: "wishlist-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Serialize Set to Array for JSON storage
      partialize: (state) => ({ bookIds: [...state.bookIds], scopeId: state.scopeId }),
      merge: (persisted, current) => ({
        ...current,
        bookIds: new Set((persisted as { bookIds: string[] }).bookIds ?? []),
        scopeId: (persisted as { scopeId?: string | null }).scopeId ?? null,
      }),
    },
  ),
);
