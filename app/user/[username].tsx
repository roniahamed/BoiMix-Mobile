import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import { BookCard } from "@/components/shared/BookCard";
import { resolveMediaUrl } from "@/lib/utils/media";
import { shareContent } from "@/lib/utils/share";
import type { UserProfile } from "@/types/user";
import type { BookCardBook } from "@/types/book";

export default function UserPublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { username } = useLocalSearchParams<{ username: string }>();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      try {
        if (username) {
          const res = await usersApi.getUserProfile(username);
          if (res.data) return res.data;
        }
      } catch {
        return null;
      }
      return null;
    },
  });

  // Fetch user's books
  const queryUser = profile?.username || username;
  const { data: userBooksData, isLoading: isLoadingBooks } = useQuery<BookCardBook[]>({
    queryKey: ["user-books", queryUser],
    queryFn: async () => {
      try {
        if (queryUser) {
          const res = await usersApi.getUserBooks(queryUser);
          return res.data?.results || [];
        }
      } catch {
        return [];
      }
      return [];
    },
    enabled: Boolean(queryUser),
  });

  const [isFollowingOverride, setIsFollowingOverride] = useState<boolean | null>(null);
  const isFollowing = isFollowingOverride !== null ? isFollowingOverride : Boolean((profile as any)?.isFollowing);

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return "সম্প্রতি";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("bn-BD", { year: "numeric", month: "long" });
    } catch {
      return dateStr;
    }
  };

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      return usersApi.followUser(profile.id);
    },
    onMutate: () => {
      setIsFollowingOverride((prev) => !(prev !== null ? prev : Boolean((profile as any)?.isFollowing)));
    },
    onError: () => {
      setIsFollowingOverride((prev) => !(prev !== null ? prev : Boolean((profile as any)?.isFollowing)));
      Alert.alert("ত্রুটি", "অনুরোধটি সম্পন্ন করা যায়নি।");
    },
  });

  if (isLoading || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-xs text-text-muted mt-2">প্রোফাইল লোড হচ্ছে...</Text>
      </View>
    );
  }

  const userBooks = userBooksData ?? [];

  const handleShareProfile = async () => {
    if (!profile) return;
    const name = profile.name || profile.username || "ব্যবহারকারী";
    const url =
      typeof window !== "undefined" && window.location?.origin
        ? `${window.location.origin}/user/${username}`
        : `https://boimix.com/user/${username}`;
    await shareContent({
      title: `${name} - BoiMix`,
      message: `BoiMix-এ ${name}-এর প্রোফাইল দেখুন:`,
      url,
      successMessage: `${name}-এর প্রোফাইল লিংক ক্লিপবোর্ডে কপি করা হয়েছে।`,
    });
  };

  return (
    <View className="flex-1 bg-surface-background">
      {/* Top Floating Back Button */}
      <View
        className="absolute z-10 left-4 right-4 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShareProfile}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView key={username} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {profile.coverUrl && resolveMediaUrl(profile.coverUrl) ? (
          <Image
            source={{ uri: resolveMediaUrl(profile.coverUrl) }}
            style={{ width: "100%", height: 160 }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: "100%", height: 140 }} className="bg-primary/10 items-center justify-center border-b border-border-light">
            <Ionicons name="book-outline" size={48} color={Colors.primary} style={{ opacity: 0.2 }} />
          </View>
        )}

        {/* Profile Card Overlay */}
        <View className="px-5 -mt-12">
          <View className="flex-row items-end justify-between">
            {profile.avatarUrl && resolveMediaUrl(profile.avatarUrl) ? (
              <Image
                source={{ uri: resolveMediaUrl(profile.avatarUrl) }}
                style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: "#FFF" }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: "#FFF" }}
                className="bg-primary/10 items-center justify-center shadow-xs"
              >
                <Ionicons name="person" size={42} color={Colors.primary} />
              </View>
            )}
            {/* Follow & Message Buttons */}
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={() => followMutation.mutate()}
                className={`px-3.5 py-2 rounded-xl flex-row items-center border ${
                  isFollowing
                    ? "bg-slate-100 border-slate-300"
                    : "bg-primary border-primary"
                }`}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "person-add-outline"}
                  size={15}
                  color={isFollowing ? Colors.textPrimary : "#FFF"}
                />
                <Text
                  className={`text-xs font-bold ml-1 ${
                    isFollowing ? "text-text-primary" : "text-white"
                  }`}
                >
                  {isFollowing ? "অনুসরণ করছেন" : "অনুসরণ করুন"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (!user) { router.push("/auth/login"); return; }
                  try {
                    const res = await messagesApi.createConversation({ recipient_username: profile.username, context_type: "direct" });
                    router.push({ pathname: "/messages/[id]", params: { id: res.data.id, name: profile.name, username: profile.username, avatar: profile.avatarUrl || "" } });
                  } catch {
                    Alert.alert("মেসেজ খোলা যায়নি", "আবার চেষ্টা করুন।");
                  }
                }}
                className="px-3.5 py-2 rounded-xl flex-row items-center border border-slate-300 bg-white shadow-xs"
              >
                <Ionicons name="chatbubble-outline" size={15} color={Colors.textPrimary} />
                <Text className="text-xs font-bold text-text-primary ml-1">মেসেজ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Details */}
          <View className="mt-3">
            <View className="flex-row items-center">
              <Text className="text-xl font-bold text-text-primary">{profile.name}</Text>
              <View className="ml-1.5">
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              </View>
            </View>
            <Text className="text-xs text-text-muted mt-0.5">@{profile.username}</Text>
            {profile.bio ? (
              <Text className="text-xs text-text-secondary mt-2 leading-5">
                {profile.bio}
              </Text>
            ) : null}

            {/* Meta Row: Location & Join date */}
            <View className="flex-row flex-wrap items-center gap-4 mt-3">
              {profile.location ? (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text className="text-xs text-text-muted ml-1">{profile.location}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                <Text className="text-xs text-text-muted ml-1">যুক্ত হয়েছেন {formatJoinedDate(profile.joinedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row bg-white rounded-2xl p-4 border border-border mt-5 shadow-sm">
            <View className="flex-1 items-center border-r border-slate-100">
              <Text className="text-lg font-bold text-text-primary">
                {profile.stats?.booksInLibrary ?? 0}
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">বই তালিকা</Text>
            </View>
            <View className="flex-1 items-center border-r border-slate-100">
              <Text className="text-lg font-bold text-text-primary">
                {profile.stats?.successfulExchanges ?? 0}
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">বিনিময়</Text>
            </View>
            <View className="flex-1 items-center border-r border-slate-100">
              <Text className="text-lg font-bold text-text-primary">
                {profile.stats?.booksSold ?? 0}
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">বিক্রি</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-text-primary mr-1">
                  {profile.rating ?? "5.0"}
                </Text>
                <Ionicons name="star" size={14} color="#EAB308" />
              </View>
              <Text className="text-[11px] text-text-muted mt-0.5">রেটিং</Text>
            </View>
          </View>

          {/* User's Books Section */}
          <View className="mt-6 mb-12">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-text-primary">
                তালিকাভুক্ত বইসমূহ ({userBooks.length})
              </Text>
            </View>

            {isLoadingBooks ? (
              <ActivityIndicator size="small" color={Colors.primary} className="py-6" />
            ) : userBooks.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center border border-border">
                <Ionicons name="book-outline" size={32} color={Colors.textMuted} />
                <Text className="text-xs text-text-muted mt-2">কোনো বই পাওয়া যায়নি</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {userBooks.map((book: BookCardBook) => (
                  <View key={book.id} style={{ width: "48%", marginBottom: 16 }}>
                    <BookCard
                      book={book}
                      onPress={() => router.push(`/book/${book.slug || book.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
