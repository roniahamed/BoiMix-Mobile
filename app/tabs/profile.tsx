import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { queryClient } from "@/providers/QueryProvider";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "লগআউট",
      "আপনি কি লগআউট করতে চান?",
      [
        { text: "না" },
        {
          text: "হ্যাঁ, লগআউট",
          style: "destructive",
          onPress: async () => {
            await authApi.logout();
            await clearSession();
            queryClient.clear();
            router.replace("/auth/login");
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4 border-2 border-primary/20">
        <Ionicons name="person" size={40} color={Colors.primary} />
      </View>
      <Text className="text-xl font-bold text-text-primary">
        {user?.name ?? "ব্যবহারকারী"}
      </Text>
      {user?.email && (
        <Text className="text-sm text-text-secondary mt-1">
          {user.email}
        </Text>
      )}
      {user?.username && (
        <Text className="text-xs text-text-muted mt-1 mb-6">
          @{user.username}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center gap-2 bg-red-50 border border-error rounded-xl px-6 py-3 mt-4"
      >
        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
        <Text className="text-error font-semibold text-sm">লগআউট করুন</Text>
      </TouchableOpacity>
    </View>
  );
}
