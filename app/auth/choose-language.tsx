import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

import { AuthHeader } from "@/components/auth/AuthHeader";

export const APP_LANGUAGE_KEY = "app_language";
export type AppLanguage = "bn" | "en";

export default function ChooseLanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSelect = async (lang: AppLanguage) => {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, lang);
    router.replace("/tabs");
  };

  return (
    <View
      style={{ paddingBottom: insets.bottom + 24 }}
      className="flex-1 bg-white"
    >
      <AuthHeader
        title="ভাষা নির্বাচন করুন"
        subtitle="আপনার পছন্দের ভাষায় BoiMix ব্যবহার করুন"
        showBack={false}
      />

      <View className="flex-1 px-6 justify-center gap-4">
        {/* Bangla */}
        <TouchableOpacity
          onPress={() => handleSelect("bn")}
          activeOpacity={0.85}
          className="border-2 border-primary rounded-2xl p-6 flex-row items-center justify-between bg-primary/5 shadow-sm"
        >
          <View>
            <Text className="text-xl font-bold text-primary">বাংলা</Text>
            <Text className="text-sm text-text-secondary mt-1">
              বাংলায় অ্যাপ ব্যবহার করুন
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Ionicons name="checkmark" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* English */}
        <TouchableOpacity
          onPress={() => handleSelect("en")}
          activeOpacity={0.85}
          className="border-2 border-border rounded-2xl p-6 flex-row items-center justify-between bg-white shadow-sm"
        >
          <View>
            <Text className="text-xl font-bold text-text-primary">English</Text>
            <Text className="text-sm text-text-secondary mt-1">
              Continue in English
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-surface-dark items-center justify-center">
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <Text className="text-xs text-text-muted text-center mt-4">
          পরে সেটিংস থেকে পরিবর্তন করা যাবে
        </Text>
      </View>
    </View>
  );
}
