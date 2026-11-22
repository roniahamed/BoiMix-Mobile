import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

type Props = {
  title: string;
  seeAllRoute?: string;
  seeAllParams?: Record<string, string>;
};

export function SectionHeader({ title, seeAllRoute, seeAllParams }: Props) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 mb-3">
      <Text className="text-base font-bold text-text-primary">{title}</Text>
      {seeAllRoute && (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: seeAllRoute as never, params: seeAllParams })
          }
          className="flex-row items-center gap-0.5"
        >
          <Text className="text-sm text-primary font-semibold">সব দেখুন</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
