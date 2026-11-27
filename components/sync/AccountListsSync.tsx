import { useEffect } from "react";
import { Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cartApi, type CartItemResponse } from "@/lib/api/cart";
import { wishlistApi } from "@/lib/api/wishlist";
import { emitCartChange, subscribeCartChanges, subscribeWishlistRefresh, type CartChange } from "@/lib/cart-sync-events";
import { queryKeys } from "@/lib/api/query-keys";

const GUEST_CART = "boimix-guest-cart-v1";
const GUEST_WISHLIST = "boimix-guest-wishlist-v1";

function asCartItem(item: CartItemResponse): CartItem {
  return {
    book: { ...item, id: item.listing_id || item.id, availabilityMode: "sell", availability: "in-stock", tags: item.tags ?? [], rating: item.rating ?? 0, reviewCount: item.reviewCount ?? 0 },
    quantity: item.quantity,
    selected: item.selected,
  };
}

export function AccountListsSync() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const authReady = useAuthStore((state) => state.isHydrated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    let version = 0;
    let queue: Promise<void> = Promise.resolve();
    let pending = 0;
    let failed = false;
    let initialDone: Promise<void> = Promise.resolve();
    let refreshWishlist = () => {};
    const valid = () => active && (useAuthStore.getState().user?.id ?? null) === userId;
    useCartStore.setState({ syncPending: !!userId, syncError: false });
    useWishlistStore.setState({ syncPending: !!userId, syncError: false });
    const unsubscribeWishlist = subscribeWishlistRefresh(() => refreshWishlist());
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active" && userId && valid()) {
        if (!useCartStore.getState().syncPending) emitCartChange({ type: "refresh" });
        if (!useWishlistStore.getState().syncPending) refreshWishlist();
      }
    });

    async function refreshCart(expectedVersion: number) {
      const response = await cartApi.getCart();
      if (valid() && version === expectedVersion && pending === 0) {
        useCartStore.setState({ items: response.data.items.map(asCartItem), syncError: false });
      }
    }

    const unsubscribe = subscribeCartChanges((change: CartChange) => {
      if (!userId || !valid()) return;
      version += 1;
      pending += 1;
      if (change.type === "refresh") failed = false;
      useCartStore.setState({ syncPending: true, syncError: false });
      queue = queue.then(async () => {
        await initialDone;
        if (!valid()) return;
        if (change.type === "add") await cartApi.addItem(change.id, change.quantity);
        else if (change.type === "update") await cartApi.updateItem(change.id, { quantity: change.quantity, selected: change.selected });
        else if (change.type === "remove") await cartApi.removeItem(change.id);
        else if (change.type === "clear") await cartApi.clearCart();
      }).catch(() => {
        if (valid()) {
          failed = true;
          useCartStore.setState({ syncError: true });
          Alert.alert("কার্ট সিঙ্ক হয়নি", "পরিবর্তনটি সার্ভারে সংরক্ষণ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
        }
      }).finally(async () => {
        pending -= 1;
        if (!valid() || pending !== 0) return;
        const currentVersion = version;
        try { await refreshCart(currentVersion); }
        catch { if (valid()) { failed = true; useCartStore.setState({ syncError: true }); } }
        if (valid() && pending === 0) useCartStore.setState({ syncPending: false, syncError: failed });
      });
    });

    initialDone = (async () => {
      // Wait for local persistence before changing account scopes.
      await Promise.all([
        useCartStore.persist.hasHydrated() ? Promise.resolve() : useCartStore.persist.rehydrate(),
        useWishlistStore.persist.hasHydrated() ? Promise.resolve() : useWishlistStore.persist.rehydrate(),
      ]);
      if (!valid()) return;
      const cart = useCartStore.getState();
      const wishlist = useWishlistStore.getState();
      if (cart.scopeId !== userId) {
        if (cart.scopeId === null) await AsyncStorage.setItem(GUEST_CART, JSON.stringify(cart.items));
        const guestItems = !userId ? await AsyncStorage.getItem(GUEST_CART) : null;
        if (!valid()) return;
        useCartStore.setState({ scopeId: userId, items: guestItems ? JSON.parse(guestItems) : [], couponCode: null, couponDiscount: 0, syncError: false });
      }
      if (wishlist.scopeId !== userId) {
        if (wishlist.scopeId === null) await AsyncStorage.setItem(GUEST_WISHLIST, JSON.stringify([...wishlist.bookIds]));
        const guestIds = !userId ? await AsyncStorage.getItem(GUEST_WISHLIST) : null;
        if (!valid()) return;
        useWishlistStore.setState({ scopeId: userId, bookIds: new Set(guestIds ? JSON.parse(guestIds) : []) });
      }
      if (!userId || !valid()) return;
      useCartStore.setState({ syncPending: true });
      useWishlistStore.setState({ syncPending: true });
      const cartVersion = version;
      const loadWishlist = async () => {
        if (valid()) useWishlistStore.setState({ syncPending: true, syncError: false });
        try {
          const initialWishlist = useWishlistStore.getState().bookIds;
          let ids: string[] = [];
          let page = 1;
          while (valid()) {
            try {
              const { data } = await wishlistApi.getWishlistItems(page, 100);
              ids.push(...data.results.map((item) => item.listing_id));
              if (!data.next) break;
              page += 1;
            } catch (error: any) {
              if (page !== 1 || error?.response?.status !== 405) throw error;
              ids = (await wishlistApi.getWishlist()).data.item_ids;
              break;
            }
          }
          if (!valid()) return;
          const current = useWishlistStore.getState().bookIds;
          const merged = new Set(ids);
          current.forEach((id) => { if (!initialWishlist.has(id)) merged.add(id); });
          initialWishlist.forEach((id) => { if (!current.has(id)) merged.delete(id); });
          useWishlistStore.setState({ bookIds: merged });
          queryClient.invalidateQueries({ queryKey: queryKeys.me.wishlist() });
        } catch {
          if (valid()) useWishlistStore.setState({ syncError: true });
        } finally {
          if (valid()) useWishlistStore.setState({ syncPending: false });
        }
      };
      refreshWishlist = () => { void loadWishlist(); };
      void loadWishlist();
      await refreshCart(cartVersion).catch(() => { if (valid()) useCartStore.setState({ syncError: true }); });
      if (valid() && pending === 0) useCartStore.setState({ syncPending: false });
    })().catch(() => {
      if (valid()) {
        useCartStore.setState({ syncPending: false, syncError: true });
        useWishlistStore.setState({ syncPending: false, syncError: true });
      }
    });

    return () => { active = false; unsubscribe(); unsubscribeWishlist(); appState.remove(); };
  }, [authReady, userId, queryClient]);
  return null;
}
