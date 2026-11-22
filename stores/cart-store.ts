import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BookCardBook } from "@/types/book";

type CartItem = {
  book: BookCardBook;
  quantity: number;
  selected: boolean;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;

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
      },

      removeItem: (bookId) =>
        set((state) => ({
          items: state.items.filter((i) => i.book.id !== bookId),
        })),

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
      },

      toggleSelect: (bookId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.book.id === bookId ? { ...i, selected: !i.selected } : i,
          ),
        })),

      selectAll: () =>
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected: true })),
        })),

      clearSelected: () =>
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected: false })),
        })),

      clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      getSelectedItems: () => get().items.filter((i) => i.selected),

      getSubtotal: () =>
        get()
          .getSelectedItems()
          .reduce((sum, i) => sum + (i.book.price ?? 0) * i.quantity, 0),

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
    },
  ),
);
