export type CartChange =
  | { type: "add"; id: string; quantity: number }
  | { type: "update"; id: string; quantity?: number; selected?: boolean }
  | { type: "remove"; id: string }
  | { type: "refresh" }
  | { type: "clear" };

type CartChangeListener = (change: CartChange) => void;
const listeners = new Set<CartChangeListener>();
export function emitCartChange(change: CartChange) { listeners.forEach((listener) => listener(change)); }
export function subscribeCartChanges(listener: CartChangeListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const wishlistRefreshListeners = new Set<() => void>();
export function requestWishlistRefresh() { wishlistRefreshListeners.forEach((listener) => listener()); }
export function subscribeWishlistRefresh(listener: () => void) {
  wishlistRefreshListeners.add(listener);
  return () => { wishlistRefreshListeners.delete(listener); };
}
