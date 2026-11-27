import { Alert, Platform } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { wishlistApi } from "@/lib/api/wishlist";
import { queryClient } from "@/providers/QueryProvider";
import { queryKeys } from "@/lib/api/query-keys";

const queues = new Map<string, Promise<void>>();

/** Update the heart immediately and serialize the desired state per book. */
export function toggleWishlist(id: string) {
  const store = useWishlistStore.getState();
  const userId = useAuthStore.getState().user?.id;
  if (store.scopeId !== (userId ?? null)) {
    const message = "আপনার তালিকা লোড হচ্ছে। একটু পর আবার চেষ্টা করুন।";
    if (Platform.OS === "web" && typeof window !== "undefined") window.alert(message);
    else Alert.alert("উইশলিস্ট", message);
    return;
  }
  const desired = !store.bookIds.has(id);
  store.toggleBook(id);
  if (!userId) return;
  const key = `${userId}:${id}`;
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    if (useAuthStore.getState().user?.id !== userId) return;
    try {
      if (desired) await wishlistApi.addItem(id);
      else await wishlistApi.removeItem(id);
      if (useAuthStore.getState().user?.id === userId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.me.wishlist() });
      }
    } catch {
      if (useAuthStore.getState().user?.id !== userId) return;
      const state = useWishlistStore.getState();
      if (state.bookIds.has(id) === desired) state.toggleBook(id);
      useWishlistStore.setState({ syncError: true });
      const message = "পরিবর্তন সংরক্ষণ করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";
      if (Platform.OS === "web" && typeof window !== "undefined") window.alert(message);
      else Alert.alert("উইশলিস্ট সিঙ্ক হয়নি", message);
    }
  });
  queues.set(key, next);
  next.finally(() => { if (queues.get(key) === next) queues.delete(key); });
}
