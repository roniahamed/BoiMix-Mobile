import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/stores/auth-store";
import { resolveMediaUrl } from "@/lib/utils/media";
import type { BookCardBook } from "@/types/book";

type TabFilter = "all" | "sale" | "borrow" | "exchange";

export default function MyBooksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: libraryBooks, isLoading, refetch } = useQuery({
    queryKey: ["my-listed-books"],
    queryFn: async () => {
      if (user) {
        try {
          const res = await usersApi.getMyLibrary({ page_size: 50 });
          return res.data?.results || [];
        } catch {
          return [] as BookCardBook[];
        }
      }
      return [] as BookCardBook[];
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const books = (libraryBooks ?? []).filter((book: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "sale") return book.isAvailableForSale ?? true;
    if (activeTab === "borrow") return book.isAvailableForBorrow;
    if (activeTab === "exchange") return book.isAvailableForExchange;
    return true;
  });

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3 bg-white border-b border-border-light flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">আমার বইসমূহ</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/upload")}
          className="flex-row items-center bg-primary px-3 py-1.5 rounded-xl shadow-xs"
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text className="text-xs font-bold text-white ml-1">নতুন বই</Text>
        </TouchableOpacity>
      </View>

      {/* Guest Mode */}
      {!user ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Ionicons name="book-outline" size={36} color={Colors.primary} />
          </View>
          <Text className="text-lg font-bold text-text-primary text-center">
            তালিকাভুক্ত বই দেখতে সাইন ইন করুন
          </Text>
          <Text className="text-sm text-text-secondary text-center mt-1.5 mb-6 max-w-xs leading-5">
            আপনার অ্যাকাউন্টে যুক্ত থাকা সকল বিক্রি, ধার ও বিনিময়ের বই পরিচালনা করতে লগইন করুন।
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
          {/* Segmented Filter */}
          <View className="flex-row bg-white px-4 py-2 border-b border-border-light">
            {(
              [
                { id: "all", label: "সব বই" },
                { id: "sale", label: "বিক্রয়" },
                { id: "borrow", label: "ধার" },
                { id: "exchange", label: "বিনিময়" },
              ] as const
            ).map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActiveTab(t.id)}
                  className={`flex-1 py-1.5 items-center rounded-lg ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.primary} />
              <Text className="text-xs text-text-muted mt-2">বই তালিকা লোড হচ্ছে...</Text>
            </View>
          ) : (
            <FlatList
              data={books}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/book/${item.slug || item.id}`)}
                  activeOpacity={0.8}
                  className="bg-white rounded-2xl p-4 mb-3 border border-border-light shadow-sm flex-row items-center"
                >
                  {Boolean(resolveMediaUrl(item.coverUrl || (item as any).cover_image_url || (item as any).cover_image || (item as any).coverImage)) ? (
                    <Image
                      source={{
                        uri: resolveMediaUrl(
                          item.coverUrl ||
                            (item as any).cover_image_url ||
                            (item as any).cover_image ||
                            (item as any).coverImage
                        ),
                      }}
                      style={{ width: 56, height: 76, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: 56, height: 76, borderRadius: 8 }} className="bg-slate-100 items-center justify-center border border-slate-200">
                      <Ionicons name="book-outline" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View className="flex-1 ml-3.5">
                    <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-0.5">
                      {item.author}
                    </Text>

                    <View className="flex-row items-center gap-2 mt-2">
                      {item.price !== undefined && item.price !== null && (
                        <Text className="text-xs font-bold text-primary">
                          ৳{item.price}
                        </Text>
                      )}
                      <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Text className="text-[10px] font-semibold text-emerald-700">
                          সক্রিয় লিস্টিং
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="p-2 rounded-xl bg-surface-dark border border-border-light">
                    <Ionicons name="eye-outline" size={18} color={Colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-24 px-6">
                  <View className="w-16 h-16 rounded-full bg-surface-dark border border-border-light items-center justify-center mb-3">
                    <Ionicons name="library-outline" size={32} color={Colors.textMuted} />
                  </View>
                  <Text className="text-base font-bold text-text-primary">
                    কোনো বই তালিকাভুক্ত নেই
                  </Text>
                  <Text className="text-xs text-text-muted mt-1 text-center mb-5">
                    আপনার আলমারির অপঠিত বা অতিরিক্ত বই বিক্রি, ধার বা বিনিময় করতে এখনই যুক্ত করুন।
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/upload")}
                    className="bg-primary px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    <Text className="text-white font-bold text-xs">বই আপলোড করুন</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}
