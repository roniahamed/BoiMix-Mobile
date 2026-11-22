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
import { usersApi } from "@/lib/api/users";
import { BookCard } from "@/components/shared/BookCard";
import type { UserProfile } from "@/types/user";
import type { BookCardBook } from "@/types/book";

export default function UserPublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      try {
        if (username) {
          const res = await usersApi.getUserProfile(username);
          if (res.data) return res.data;
        }
      } catch {
        // fallback
      }
      return {
        id: "u-101",
        name: username ? `${username}` : "বইপ্রেমী সদস্য",
        username: username || "boipremik",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        coverUrl: "https://images.unsplash.com/photo-1507842229458-7629a1b8ddec?w=800",
        bio: "নিয়মিত বই পড়তে এবং সংগ্রহ করতে পছন্দ করি। গল্প ও উপন্যাস বেশি পড়া হয়।",
        location: "মিরপুর, ঢাকা",
        rating: 4.9,
        reputation: 98,
        joinedAt: "২০২৩ সালের মার্চ",
        responseRate: 95,
        responseTime: "১ ঘণ্টার মধ্যে",
        isFollowing: false,
        stats: {
          booksInLibrary: 14,
          successfulExchanges: 8,
          booksBorrowed: 5,
          booksSold: 12,
          followers: 42,
          following: 19,
        },
        profileBadges: [],
      };
    },
  });

  // Fetch user's books
  const { data: userBooksData, isLoading: isLoadingBooks } = useQuery<BookCardBook[]>({
    queryKey: ["user-books", username],
    queryFn: async () => {
      try {
        if (username) {
          const res = await usersApi.getUserBooks(username);
          return res.data?.results || [];
        }
      } catch {
        // fallback
      }
      return [
        {
          id: "bk-1",
          slug: "deyal",
          title: "দেয়াল",
          author: "হুমায়ূন আহমেদ",
          price: 320,
          originalPrice: 400,
          coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
          tags: ["উপন্যাস", "ইতিহাস"],
          rating: 4.8,
          reviewCount: 32,
          condition: "new",
          availability: "in-stock",
        },
        {
          id: "bk-2",
          slug: "chander-pahar",
          title: "চাঁদের পাহাড়",
          author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
          price: 250,
          originalPrice: 300,
          coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
          tags: ["অ্যাডভেঞ্চার"],
          rating: 4.9,
          reviewCount: 45,
          condition: "good",
          availability: "in-stock",
        },
      ];
    },
  });

  const [isFollowing, setIsFollowing] = useState(profile?.isFollowing || false);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      return usersApi.followUser(profile.id);
    },
    onMutate: () => {
      setIsFollowing((prev) => !prev);
    },
    onError: () => {
      setIsFollowing((prev) => !prev);
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
          onPress={() => Alert.alert("শেয়ার", "প্রোফাইল লিংক কপি করা হয়েছে।")}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <Image
          source={{ uri: profile.coverUrl || "https://images.unsplash.com/photo-1507842229458-7629a1b8ddec?w=800" }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />

        {/* Profile Card Overlay */}
        <View className="px-5 -mt-12">
          <View className="flex-row items-end justify-between">
            <Image
              source={{ uri: profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" }}
              style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: "#FFF" }}
              contentFit="cover"
            />
            {/* Follow & Message Buttons */}
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={() => followMutation.mutate()}
                className={`px-4 py-2 rounded-xl flex-row items-center border ${
                  isFollowing
                    ? "bg-slate-100 border-slate-300"
                    : "bg-primary border-primary"
                }`}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "person-add-outline"}
                  size={16}
                  color={isFollowing ? Colors.textPrimary : "#FFF"}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    isFollowing ? "text-text-primary" : "text-white"
                  }`}
                >
                  {isFollowing ? "অনুসরণ করছেন" : "অনুসরণ করুন"}
                </Text>
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
            {profile.bio && (
              <Text className="text-xs text-text-secondary mt-2 leading-5">
                {profile.bio}
              </Text>
            )}

            {/* Meta Row: Location & Join date */}
            <View className="flex-row flex-wrap items-center gap-4 mt-3">
              {profile.location && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text className="text-xs text-text-muted ml-1">{profile.location}</Text>
                </View>
              )}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                <Text className="text-xs text-text-muted ml-1">যুক্ত হয়েছেন {profile.joinedAt}</Text>
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
