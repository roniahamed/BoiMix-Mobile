import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { booksApi } from "@/lib/api/books";
import { BookCard } from "@/components/shared/BookCard";
import type { BookCardBook } from "@/types/book";

const SORT_OPTIONS = [
  { id: "-rating", label: "জনপ্রিয়" },
  { id: "-created_at", label: "নতুন" },
  { id: "price", label: "মূল্য: কম" },
  { id: "-price", label: "মূল্য: বেশি" },
];

export default function CategoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, name, nameBn } = useLocalSearchParams<{
    slug: string;
    name?: string;
    nameBn?: string;
  }>();

  const [ordering, setOrdering] = useState("-rating");
  const [refreshing, setRefreshing] = useState(false);

  const displayName = nameBn || name || (slug ? slug.replace(/-/g, " ") : "ক্যাটাগরি");

  const { data: books, isLoading, refetch } = useQuery<BookCardBook[]>({
    queryKey: ["category-books", slug, ordering],
    queryFn: async () => {
      try {
        if (slug) {
          const res = await booksApi.getBooks({
            category: slug,
            ordering,
            page_size: 24,
          });
          return res.data?.results || [];
        }
      } catch {
        // fallback
      }
      return [];
    },
    enabled: !!slug,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3 bg-white border-b border-border-light flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-primary capitalize" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-xs text-text-muted">
              {books ? `${books.length}টি বই পাওয়া গেছে` : "বই তালিকা"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/search")}
          className="w-9 h-9 rounded-full bg-surface-dark items-center justify-center border border-border-light"
        >
          <Ionicons name="search-outline" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Sort Filter Bar */}
      <View className="flex-row bg-white px-3 py-2 border-b border-border-light gap-2">
        {SORT_OPTIONS.map((opt) => {
          const active = ordering === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setOrdering(opt.id)}
              className={`px-3 py-1.5 rounded-xl border ${
                active
                  ? "bg-primary/10 border-primary"
                  : "bg-surface-dark border-border-light"
              }`}
            >
              <Text
                className={`text-xs ${
                  active ? "font-bold text-primary" : "text-text-secondary"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Book Grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text className="text-xs text-text-muted mt-2">বই লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          key={slug}
          data={books ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="w-[48%] mb-3">
              <BookCard book={item} variant="grid" />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6 w-full">
              <View className="w-16 h-16 rounded-full bg-surface-dark border border-border-light items-center justify-center mb-3">
                <Ionicons name="book-outline" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary">
                কোনো বই পাওয়া যায়নি
              </Text>
              <Text className="text-xs text-text-muted mt-1 text-center mb-5">
                এই ক্যাটাগরিতে বর্তমানে কোনো সক্রিয় লিস্টিং নেই। আপনি চাইলে নতুন বই যুক্ত করতে পারেন।
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
  );
}
