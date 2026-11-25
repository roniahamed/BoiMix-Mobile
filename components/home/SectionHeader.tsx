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
      <View className="flex-row items-center flex-1"><View className="w-1 h-6 rounded-full bg-primary mr-2.5" /><Text className="text-lg font-bold text-text-primary">{title}</Text></View>
      {!!seeAllRoute && (
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
