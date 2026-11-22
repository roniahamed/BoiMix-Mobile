import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SocialButtonProps = {
  provider: "google";
  onPress: () => void;
  loading?: boolean;
};

export function SocialButton({ provider, onPress, loading }: SocialButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      className={`
        flex-row items-center justify-center
        border border-border rounded-xl py-3.5 px-5 bg-surface
        ${loading ? "opacity-50" : ""}
      `}
    >
      {provider === "google" && (
        <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
      )}
      <Text className="text-base font-medium text-text-primary">
        Google দিয়ে সাইন ইন
      </Text>
    </TouchableOpacity>
  );
}
