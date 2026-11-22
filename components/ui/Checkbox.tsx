import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type CheckboxProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: React.ReactNode;
  error?: string;
};

export function Checkbox({ checked, onChange, label, error }: CheckboxProps) {
  return (
    <View>
      <TouchableOpacity
        onPress={() => onChange(!checked)}
        activeOpacity={0.7}
        className="flex-row items-start gap-3"
      >
        <View
          className={`
            w-5 h-5 rounded border-2 items-center justify-center mt-0.5
            ${checked ? "bg-primary border-primary" : "border-border bg-surface"}
          `}
        >
          {checked && (
            <Ionicons name="checkmark" size={14} color="#FFF" />
          )}
        </View>
        {label && <View className="flex-1">{label}</View>}
      </TouchableOpacity>
      {error && (
        <Text className="text-xs text-error mt-1 ml-8">{error}</Text>
      )}
    </View>
  );
}
