import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function AuthHeader({ title, subtitle, showBack = true }: AuthHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-6 pb-6">
      {showBack && router.canGoBack() && (
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-10 h-10 items-center justify-center -ml-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}
      <Text className="text-2xl font-bold text-text-primary">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-text-secondary mt-1">{subtitle}</Text>
      )}
    </View>
  );
}
