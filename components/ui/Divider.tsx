import { View, Text } from "react-native";

type DividerProps = {
  label?: string;
};

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View className="h-px bg-border my-4" />;
  }

  return (
    <View className="flex-row items-center my-5">
      <View className="flex-1 h-px bg-border" />
      <Text className="mx-3 text-sm text-text-muted">{label}</Text>
      <View className="flex-1 h-px bg-border" />
    </View>
  );
}
