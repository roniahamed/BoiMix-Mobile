import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  loading?: boolean;
  onFilterPress?: () => void;
  filterCount?: number;
};

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "বই খুঁজুন...",
  autoFocus = false,
  loading = false,
  onFilterPress,
  filterCount = 0,
}: Props) {
  const inputRef = useRef<any>(null);

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 flex-row items-center border border-border bg-white rounded-full px-4 h-12 shadow-sm">
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} className="mr-2" />
        <TextInput
          ref={inputRef}
          className="flex-1 text-base text-text-primary ml-2"
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={onClear} className="pl-2">
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel={filterCount > 0 ? `${filterCount}টি ফিল্টার সক্রিয়` : "ফিল্টার খুলুন"}
          className={`relative w-12 h-12 border rounded-full items-center justify-center shadow-sm ${filterCount > 0 ? "bg-primary border-primary" : "bg-white border-border"}`}
        >
          <Ionicons name="options-outline" size={20} color={filterCount > 0 ? Colors.textInverse : Colors.textPrimary} />
          {filterCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-error rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center border border-white">
              <Text className="text-white text-[10px] font-bold">{filterCount > 9 ? "9+" : filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
