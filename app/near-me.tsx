import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export default function NearMeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text-primary">কাছের বই</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="map-outline" size={40} color={Colors.primary} />
        </View>
        <Text className="text-lg font-bold text-text-primary">ম্যাপ ভিউ</Text>
        <Text className="text-sm text-text-secondary text-center mt-2">
          আশেপাশের বই দেখতে আপনার লোকেশন ব্যবহার করা হবে
        </Text>
      </View>
    </View>
  );
}
