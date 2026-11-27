import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
};

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary",
    text: "text-white font-semibold",
  },
  secondary: {
    container: "bg-secondary",
    text: "text-white font-semibold",
  },
  outline: {
    container: "border border-primary bg-transparent",
    text: "text-primary font-semibold",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-primary font-semibold",
  },
  danger: {
    container: "bg-error",
    text: "text-white font-semibold",
  },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-2 rounded-full", text: "text-sm" },
  md: { container: "px-5 py-3 rounded-full", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-full", text: "text-lg" },
};

const pressedColors: Record<Variant, string> = {
  primary: Colors.primaryDark,
  secondary: Colors.secondaryDark,
  outline: Colors.primarySoft,
  ghost: Colors.primarySoft,
  danger: "#B91C1C",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const { container, text } = variantStyles[variant];
  const { container: sizeContainer, text: sizeText } = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={pressed && !isDisabled ? { backgroundColor: pressedColors[variant] } : undefined}
      className={`
        flex-row items-center justify-center
        ${container} ${sizeContainer}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
      `}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? Colors.primary : Colors.textInverse}
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${text} ${sizeText}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
