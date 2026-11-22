import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";

export default function SellTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const handleStartSelling = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/upload");
  };

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-5 py-4 bg-white border-b border-border-light flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-text-primary">বই বিক্রি ও লেনদেন</Text>
          <Text className="text-xs text-text-muted mt-0.5">
            আপনার অতিরিক্ত বই অন্য পাঠকের কাছে পৌঁছে দিন
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          className="w-10 h-10 rounded-xl bg-surface-dark items-center justify-center border border-border-light"
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main CTA Card */}
        <View className="bg-primary rounded-3xl p-6 mb-5 shadow-sm">
          <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mb-4">
            <Ionicons name="book" size={30} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-white leading-7">
            ঘরে বসে বই বিক্রি, ধার অথবা বিনিময় করুন
          </Text>
          <Text className="text-sm text-white/85 mt-2 leading-5">
            কয়েক ক্লিকেই আপনার বইয়ের ছবি ও মূল্য দিয়ে লিস্টিং তৈরি করুন। লক্ষাধিক পাঠকের কাছে পৌঁছে যাবে আপনার বই।
          </Text>

          <TouchableOpacity
            onPress={handleStartSelling}
            activeOpacity={0.85}
            className="bg-white rounded-xl py-3.5 px-5 mt-5 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle" size={22} color={Colors.primary} />
            <Text className="text-sm font-bold text-primary">
              নতুন বই লিস্টিং যোগ করুন
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Key Options */}
        <Text className="text-sm font-bold text-text-primary mb-3">
          আপনি যা যা করতে পারেন
        </Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={handleStartSelling}
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-border-light flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-sell/10 items-center justify-center mr-3.5">
              <Ionicons name="pricetag-outline" size={24} color={Colors.sell} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">বই বিক্রয়</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                পুরানো বা নতুন বই কাঙ্ক্ষিত মূল্যে বিক্রি করুন
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartSelling}
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-border-light flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-borrow/10 items-center justify-center mr-3.5">
              <Ionicons name="time-outline" size={24} color={Colors.borrow} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">বই ধার দেওয়া</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                নিরাপদ জামানত রেখে অন্যদের বই ধার দিয়ে আয় করুন
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartSelling}
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-border-light flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-exchange/10 items-center justify-center mr-3.5">
              <Ionicons name="swap-horizontal-outline" size={24} color={Colors.exchange} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">বই বিনিময়</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                পড়া বই দিয়ে অন্য পাঠকের পছন্দসই বই সংগ্রহ করুন
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text className="text-sm font-bold text-text-primary mb-3">
          আপনার সেলস ও ম্যানেজমেন্ট
        </Text>
        <View className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <TouchableOpacity
            onPress={() => router.push("/tabs/orders")}
            className="flex-row items-center p-4 border-b border-border-light"
          >
            <Ionicons name="bag-check-outline" size={20} color={Colors.textSecondary} className="mr-3" />
            <Text className="flex-1 text-sm font-semibold text-text-primary ml-2">
              অর্ডার ও ডেলিভারি হিস্ট্রি
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/tabs/profile")}
            className="flex-row items-center p-4"
          >
            <Ionicons name="library-outline" size={20} color={Colors.textSecondary} className="mr-3" />
            <Text className="flex-1 text-sm font-semibold text-text-primary ml-2">
              আমার তালিকাভুক্ত বইসমূহ
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
