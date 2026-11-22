import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";
import { resolveMediaUrl } from "@/lib/utils/media";

const FALLBACK_CONVERSATIONS: any[] = [
  {
    id: "conv-demo-1",
    other_participant: {
      id: "u-101",
      username: "tanjil_reader",
      full_name: "তানজিল আহমেদ",
      avatar_url: null,
      is_online: true,
    },
    last_message: {
      id: "m-1",
      body: "ভাইয়া, 'লালসালু' বইটি কি এখনও পাওয়া যাবে? আমি ধানমন্ডি থেকে নিতে পারি।",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    unread_count: 2,
    context_type: "listing",
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "conv-demo-2",
    other_participant: {
      id: "u-102",
      username: "booklover_sakib",
      full_name: "সাকিব হাসান",
      avatar_url: null,
      is_online: false,
    },
    last_message: {
      id: "m-2",
      body: "হ্যাঁ, আমি আগামীকাল বিকেলে বই বিনিময়ের জন্য দেখা করতে পারব।",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    unread_count: 0,
    context_type: "exchange",
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "conv-demo-3",
    other_participant: {
      id: "u-support",
      username: "boimix_support",
      full_name: "BoiMix সাপোর্ট টিম",
      avatar_url: null,
      is_online: true,
    },
    last_message: {
      id: "m-3",
      body: "আপনার ডেলিভারি সংক্রান্ত কোনো তথ্য লাগলে আমাদের জানাতে পারেন।",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    unread_count: 0,
    context_type: "support",
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

function formatTime(isoString?: string) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return "এইমাত্র";
  if (diffMinutes < 60) return `${diffMinutes} মি আগে`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  return date.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ["conversations-list", search],
    queryFn: async () => {
      if (user) {
        try {
          const res = await messagesApi.getConversations({ search: search || undefined });
          const items = res.data?.results;
          if (items && items.length > 0) return items;
        } catch {
          // Fallback to demo conversations
        }
      }
      return FALLBACK_CONVERSATIONS;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const list = (conversations ?? []).filter((c: any) => {
    if (!search.trim()) return true;
    const name = c.other_participant?.full_name || c.other_participant?.username || "";
    const body = c.last_message?.body || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      body.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3 bg-white border-b border-border-light flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">মেসেজ ও বার্তা</Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          className="w-9 h-9 rounded-full bg-surface-dark items-center justify-center border border-border-light"
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Guest View */}
      {!user ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={36} color={Colors.primary} />
          </View>
          <Text className="text-lg font-bold text-text-primary text-center">
            মেসেজ দেখতে সাইন ইন করুন
          </Text>
          <Text className="text-sm text-text-secondary text-center mt-1.5 mb-6 max-w-xs leading-5">
            বই বিক্রেতা ও অন্যান্য পাঠকদের সাথে সরাসরি চ্যাট করতে আপনার অ্যাকাউন্টে লগইন করুন।
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            className="bg-primary px-8 py-3 rounded-xl shadow-sm"
          >
            <Text className="text-white font-bold text-sm">লগইন বা সাইন আপ করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          {/* Search Bar */}
          <View className="p-3 bg-white border-b border-border-light">
            <View className="flex-row items-center bg-surface-dark rounded-xl px-3 h-10 border border-border-light">
              <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
              <TextInput
                className="flex-1 text-sm text-text-primary ml-2"
                placeholder="মেসেজ বা ব্যবহারকারী খুঁজুন..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.primary} />
              <Text className="text-xs text-text-muted mt-2">কথোপকথন লোড হচ্ছে...</Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 6 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              renderItem={({ item }) => {
                const other = item.other_participant;
                const name = other?.full_name || other?.username || "বইপ্রেমী পাঠক";
                const lastMsg = item.last_message?.body || item.last_message?.preview_text || "কোনো বার্তা নেই";
                const hasUnread = (item.unread_count ?? 0) > 0;

                return (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/messages/[id]",
                        params: {
                          id: item.id,
                          name,
                          username: other?.username || "",
                          avatar: other?.avatar_url || "",
                        },
                      })
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center px-4 py-3.5 bg-white border-b border-border-light"
                  >
                    {/* Avatar */}
                    <View className="relative mr-3.5">
                      {other?.avatar_url ? (
                        <Image
                          source={{ uri: resolveMediaUrl(other.avatar_url) }}
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                          <Ionicons name="person" size={24} color={Colors.primary} />
                        </View>
                      )}
                      {other?.is_online && (
                        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className={`text-sm ${hasUnread ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        <Text className="text-[11px] text-text-muted">
                          {formatTime(item.last_message?.created_at || item.updated_at)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-xs flex-1 mr-2 ${hasUnread ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                          numberOfLines={1}
                        >
                          {lastMsg}
                        </Text>

                        {hasUnread && (
                          <View className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary items-center justify-center">
                            <Text className="text-[10px] font-bold text-white">
                              {item.unread_count}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="items-center justify-center py-24 px-6">
                  <View className="w-14 h-14 rounded-full bg-surface-dark border border-border-light items-center justify-center mb-3">
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.textMuted} />
                  </View>
                  <Text className="text-base font-bold text-text-primary">কোনো মেসেজ নেই</Text>
                  <Text className="text-xs text-text-muted mt-1 text-center">
                    বই নিয়ে আলোচনা বা লেনদেনের জন্য যেকোনো বইয়ের বিবরণ পৃষ্ঠা থেকে বিক্রেতাকে মেসেজ পাঠাতে পারেন।
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}
