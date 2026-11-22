import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export default function OrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
        <Ionicons name="bag-handle-outline" size={32} color={Colors.primary} />
      </View>
      <Text className="text-lg font-bold text-text-primary">আপনার অর্ডার ও লেনদেন</Text>
      <Text className="text-sm text-text-secondary mt-1 text-center">
        এখানে কেনা বই, ধার নেওয়া বই এবং বিনিময়ের রেকর্ড থাকবে
      </Text>
    </View>
  );
}
