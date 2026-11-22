import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  hint,
  rightIcon,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-text-primary mb-1.5">
          {label}
        </Text>
      )}

      <View
        className={`
          flex-row items-center
          border rounded-xl px-4 bg-surface
          ${error ? "border-error" : "border-border"}
        `}
      >
        <TextInput
          className="flex-1 py-3.5 text-base text-text-primary"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            className="pl-2"
          >
            <Text className="text-sm text-text-secondary">
              {showPassword ? "লুকাও" : "দেখাও"}
            </Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="pl-2">{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text className="text-xs text-error mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-text-muted mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}
