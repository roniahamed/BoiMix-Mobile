import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BookCardBook } from "@/types/book";
import { emitCartChange } from "@/lib/cart-sync-events";

export type CartItem = {
  book: BookCardBook;
  quantity: number;
  selected: boolean;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  scopeId: string | null;
  syncPending: boolean;
  syncError: boolean;

  // Actions
  addItem: (book: BookCardBook, quantity?: number) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  toggleSelect: (bookId: string) => void;
  selectAll: () => void;
  clearSelected: () => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Computed
  getSelectedItems: () => CartItem[];
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      scopeId: null,
      syncPending: false,
      syncError: false,

      addItem: (book, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.book.id === book.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.book.id === book.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { book, quantity, selected: true }],
          };
        });
        emitCartChange({ type: "add", id: book.id, quantity });
      },

      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter((i) => i.book.id !== bookId),
        }));
        emitCartChange({ type: "remove", id: bookId });
      },

      updateQuantity: (bookId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(bookId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.book.id === bookId ? { ...i, quantity } : i,
          ),
        }));
        emitCartChange({ type: "update", id: bookId, quantity });
      },

      toggleSelect: (bookId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.book.id === bookId ? { ...i, selected: !i.selected } : i,
          ),
        }));
        const item = get().items.find((i) => i.book.id === bookId);
        if (item) emitCartChange({ type: "update", id: bookId, selected: item.selected });
      },

      selectAll: () => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected: true })),
        }));
        get().items.forEach((item) => emitCartChange({ type: "update", id: item.book.id, selected: true }));
      },

      clearSelected: () => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected: false })),
        }));
        get().items.forEach((item) => emitCartChange({ type: "update", id: item.book.id, selected: false }));
      },

      clearCart: () => { set({ items: [], couponCode: null, couponDiscount: 0 }); emitCartChange({ type: "clear" }); },

      applyCoupon: (code, discount) =>
        set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      getSelectedItems: () => get().items.filter((i) => i.selected),

      getSubtotal: () =>
        get()
          .getSelectedItems()
          .reduce((sum, i) => sum + Number(i.book.price ?? 0) * i.quantity, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return Math.max(0, subtotal - get().couponDiscount);
      },

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode, couponDiscount: state.couponDiscount, scopeId: state.scopeId }),
    },
  ),
);
