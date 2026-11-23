import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 6) }}
      className="bg-amber-500 px-4 py-2 flex-row items-center justify-center z-50 shadow-sm"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <Text className="text-white text-xs font-bold ml-2">
        ইন্টারনেট সংযোগ বিচ্ছিন্ন — অফলাইন মোডে আছেন
      </Text>
    </View>
  );
}
