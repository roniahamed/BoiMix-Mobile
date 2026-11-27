import { Alert, Platform } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

export function isCartReadyForCurrentAccount() {
  const auth = useAuthStore.getState();
  if (auth.isHydrated && useCartStore.getState().scopeId === (auth.user?.id ?? null)) return true;
  const message = "আপনার কার্ট লোড হচ্ছে। একটু পর আবার চেষ্টা করুন।";
  if (Platform.OS === "web" && typeof window !== "undefined") window.alert(message);
  else Alert.alert("কার্ট", message);
  return false;
}
