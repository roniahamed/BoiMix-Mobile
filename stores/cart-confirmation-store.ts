import { create } from "zustand";

type CartConfirmationState = {
  title: string | null;
  show: (title: string) => void;
  dismiss: () => void;
};

export const useCartConfirmationStore = create<CartConfirmationState>((set) => ({
  title: null,
  show: (title) => set({ title }),
  dismiss: () => set({ title: null }),
}));
