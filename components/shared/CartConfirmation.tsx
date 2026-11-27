import { useEffect } from "react";
import { BackHandler, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { useCartConfirmationStore } from "@/stores/cart-confirmation-store";
import { useCartStore } from "@/stores/cart-store";

export function CartConfirmation() {
  const router = useRouter();
  const title = useCartConfirmationStore((state) => state.title);
  const dismiss = useCartConfirmationStore((state) => state.dismiss);
  const syncPending = useCartStore((state) => state.syncPending);
  const syncError = useCartStore((state) => state.syncError);
  useEffect(() => {
    if (title === null) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => { dismiss(); return true; });
    return () => listener.remove();
  }, [title, dismiss]);
  if (title === null) return null;
  return (
    <View accessibilityViewIsModal onAccessibilityEscape={dismiss} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, elevation: 1000 }} className="justify-center px-6 bg-black/50">
        <Pressable onPress={dismiss} className="absolute inset-0" accessibilityLabel="বন্ধ করুন" />
        <View className="bg-white rounded-3xl p-6 items-center w-full">
          <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-3"><Ionicons name={syncError ? "alert-circle" : "checkmark-circle"} size={36} color={syncError ? Colors.error : Colors.primary} /></View>
          <Text className="w-full text-lg font-bold text-secondary text-center">{syncError ? "কার্ট সিঙ্ক হয়নি" : "কার্টে যোগ হয়েছে"}</Text>
          <Text className="w-full text-sm text-text-secondary text-center mt-2" numberOfLines={3}>{title}</Text>
          {syncPending || syncError ? <Text className="w-full text-xs text-text-secondary text-center mt-2">{syncError ? "সার্ভারে সংরক্ষণ করা যায়নি। কার্ট থেকে আবার চেষ্টা করুন।" : "সার্ভারে সংরক্ষণ হচ্ছে..."}</Text> : null}
          <View className="flex-row gap-3 mt-5 w-full">
            <TouchableOpacity onPress={dismiss} className="flex-1 border border-border rounded-xl py-3 px-2 items-center justify-center" accessibilityRole="button"><Text className="w-full text-center text-sm font-semibold text-text-primary">ঠিক আছে</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { dismiss(); router.push("/cart"); }} className="flex-1 bg-primary rounded-xl py-3 px-2 items-center justify-center" accessibilityRole="button"><Text className="w-full text-center text-sm font-bold text-white">কার্ট দেখুন</Text></TouchableOpacity>
          </View>
        </View>
    </View>
  );
}
