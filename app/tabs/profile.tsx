import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { queryClient } from "@/providers/QueryProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Fetch full profile / stats
  const { data: profile } = useQuery({
    queryKey: ["my-profile-tab"],
    queryFn: async () => {
      try {
        const res = await usersApi.getMyProfile();
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert(
      "লগআউট নিশ্চিতকরণ",
      "আপনি কি BoiMix অ্যাকাউন্ট থেকে লগআউট করতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ, লগআউট",
          style: "destructive",
          onPress: async () => {
            await authApi.logout();
            await clearSession();
            queryClient.clear();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  const stats = profile?.stats || {
    booksInLibrary: 8,
    successfulExchanges: 4,
    booksBorrowed: 3,
    booksSold: 6,
    followers: 18,
    following: 12,
  };

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: insets.top }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-white border-b border-border">
        <Text className="text-xl font-bold text-text-primary">আমার অ্যাকাউন্ট</Text>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 border border-slate-200"
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        {!user ? (
          <View className="bg-white rounded-3xl p-5 border border-primary/20 shadow-sm mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mr-3.5">
                <Ionicons name="person-circle-outline" size={36} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary">
                  সম্মানিত পাঠক, স্বাগতম!
                </Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  অর্ডার, পছন্দের তালিকা ও নিজস্ব বই পরিচালনা করতে সাইন ইন করুন
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.85}
              className="bg-primary rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-sm">
                সাইন ইন / অ্যাকাউন্ট তৈরি করুন
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-5 border border-border shadow-sm mb-4">
            <View className="flex-row items-center">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 68, height: 68, borderRadius: 34 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
                  <Ionicons name="person" size={32} color={Colors.primary} />
                </View>
              )}

              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-lg font-bold text-text-primary">
                    {user?.name || "সম্মানিত পাঠক"}
                  </Text>
                  <View className="ml-1.5">
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  </View>
                </View>
                {user?.username && (
                  <Text className="text-xs text-text-muted mt-0.5">
                    @{user.username}
                  </Text>
                )}
                {user?.email && (
                  <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/profile/edit")}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="create-outline" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => router.push("/profile/my-books")}
                className="items-center flex-1 border-r border-slate-100"
              >
                <Text className="text-base font-bold text-primary">{stats.booksInLibrary}</Text>
                <Text className="text-[11px] text-text-muted mt-0.5">বই তালিকা</Text>
              </TouchableOpacity>
              <View className="items-center flex-1 border-r border-slate-100">
                <Text className="text-base font-bold text-text-primary">{stats.booksBorrowed}</Text>
                <Text className="text-[11px] text-text-muted mt-0.5">ধার নেওয়া</Text>
              </View>
              <View className="items-center flex-1 border-r border-slate-100">
                <Text className="text-base font-bold text-text-primary">{stats.successfulExchanges}</Text>
                <Text className="text-[11px] text-text-muted mt-0.5">বিনিময়</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-base font-bold text-text-primary">{stats.booksSold}</Text>
                <Text className="text-[11px] text-text-muted mt-0.5">বিক্রি</Text>
              </View>
            </View>
          </View>
        )}

        {/* Upload Book Call To Action */}
        <TouchableOpacity
          onPress={() => router.push("/upload")}
          className="bg-primary rounded-2xl p-4 flex-row items-center justify-between mb-4 shadow-sm"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center mr-3">
              <Ionicons name="add-circle" size={26} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">নতুন বই যোগ করুন</Text>
              <Text className="text-white/80 text-xs mt-0.5">
                আপনার বই বিক্রি, ধার বা বিনিময় করতে তালিকাভুক্ত করুন
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Activity & Transactions Section */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
          অ্যাক্টিভিটি ও লেনদেন
        </Text>
        <View className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <TouchableOpacity
            onPress={() => router.push("/profile/my-books")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <Ionicons name="library-outline" size={18} color="#D97706" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              আমার তালিকাভুক্ত বইসমূহ (My Books)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/messages")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-violet-50 items-center justify-center mr-3">
              <Ionicons name="chatbubbles-outline" size={18} color="#7C3AED" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              মেসেজ ও চ্যাট (Messages)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/tabs/orders")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="bag-check-outline" size={18} color="#2563EB" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              আমার অর্ডারসমূহ (ক্রয়, ধার ও বিনিময়)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/wishlist")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center mr-3">
              <Ionicons name="heart-outline" size={18} color="#E11D48" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              পছন্দের তালিকা (Wishlist)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/cart")}
            className="flex-row items-center p-3.5"
          >
            <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mr-3">
              <Ionicons name="cart-outline" size={18} color="#059669" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              শপিং ব্যাগ (Cart)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account & App Settings */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
          অ্যাকাউন্ট সেটিংস
        </Text>
        <View className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <TouchableOpacity
            onPress={() => router.push("/profile/edit")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3">
              <Ionicons name="person-outline" size={18} color={Colors.textPrimary} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              প্রোফাইল সম্পাদনা
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <Ionicons name="notifications-outline" size={18} color="#D97706" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              বিজ্ঞপ্তি ও নোটিফিকেশন
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/choose-language")}
            className="flex-row items-center p-3.5"
          >
            <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center mr-3">
              <Ionicons name="globe-outline" size={18} color="#7C3AED" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              ভাষা পরিবর্তন (Language)
            </Text>
            <Text className="text-xs text-text-muted mr-1.5">বাংলা</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {!!user && (
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 bg-red-50 border border-error/20 rounded-2xl p-4 mt-2 mb-6"
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text className="text-error font-bold text-sm">লগআউট করুন</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
