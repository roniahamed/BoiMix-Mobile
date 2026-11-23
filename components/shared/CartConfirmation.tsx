import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { useCartConfirmationStore } from "@/stores/cart-confirmation-store";

export function CartConfirmation() {
  const router = useRouter();
  const title = useCartConfirmationStore((state) => state.title);
  const dismiss = useCartConfirmationStore((state) => state.dismiss);
  return (
    <Modal visible={title !== null} transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 justify-center px-6 bg-black/50">
        <Pressable onPress={dismiss} className="absolute inset-0" accessibilityLabel="বন্ধ করুন" />
        <View className="bg-white rounded-3xl p-6 items-center w-full">
          <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-3"><Ionicons name="checkmark-circle" size={36} color={Colors.primary} /></View>
          <Text className="text-lg font-bold text-secondary text-center">কার্টে যোগ হয়েছে</Text>
          <Text className="text-sm text-text-secondary text-center mt-2" numberOfLines={3}>{title}</Text>
          <View className="flex-row gap-3 mt-5 w-full">
            <TouchableOpacity onPress={dismiss} className="flex-1 border border-border rounded-xl py-3 px-2 items-center justify-center" accessibilityRole="button"><Text className="text-sm font-semibold text-text-primary">ঠিক আছে</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { dismiss(); router.push("/cart"); }} className="flex-1 bg-primary rounded-xl py-3 px-2 items-center justify-center" accessibilityRole="button"><Text className="text-sm font-bold text-white">কার্ট দেখুন</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
