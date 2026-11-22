import { create } from "zustand";
import { messagesApi } from "@/lib/api/messages";

type MessageStore = {
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: (amount?: number) => void;
  incrementUnreadCount: () => void;
  clearUnreadCount: () => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
  unreadCount: 0,
  activeConversationId: null,

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  fetchUnreadCount: async () => {
    try {
      const res = await messagesApi.getUnreadCount();
      set({ unreadCount: res.data.total_unread_count ?? 0 });
    } catch {
      // Ignore unauthenticated / network errors
    }
  },

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

  decrementUnreadCount: (amount = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  clearUnreadCount: () => set({ unreadCount: 0 }),
}));
