import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { wishlistApi } from "@/lib/api/wishlist";
import { queryKeys } from "@/lib/api/query-keys";
import { Alert, View, FlatList, Platform, ScrollView, Text, TouchableOpacity } from "react-native";
import { BookCard, BookCardSkeleton } from "@/components/shared/BookCard";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { BookCardBook } from "@/types/book";

type Props = {
  title: string;
  books: BookCardBook[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  seeAllRoute?: string;
};

export function BookHorizontalList({
  title,
  books,
  loading,
  error,
  onRetry,
  seeAllRoute,
}: Props) {
  const queryClient = useQueryClient();
  const bookIds = useWishlistStore((state) => state.bookIds);
  const toggleBook = useWishlistStore((state) => state.toggleBook);
  const user = useAuthStore((state) => state.user);
  const handleWishlist = useCallback(async (id: string) => {
    toggleBook(id);
    if (user) {
      try {
        await wishlistApi.toggleWishlist(id);
      } catch {
        toggleBook(id);
        Alert.alert("পছন্দের তালিকা", "পরিবর্তন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.me.wishlist() });
  }, [toggleBook, user, queryClient]);
  const renderBookItem = useCallback(
    ({ item }: { item: BookCardBook }) => <BookCard book={{ ...item, isWishlisted: bookIds.has(item.id) }} variant="horizontal" onWishlistToggle={handleWishlist} />,
    [bookIds, handleWishlist]
  );

  if (error) {
    return (
      <View className="mb-5">
        <SectionHeader title={title} />
        <View className="items-center py-4">
          <Text className="text-sm text-text-secondary mb-2">লোড হয়নি</Text>
          {onRetry && (
            <TouchableOpacity onPress={onRetry}>
              <Text className="text-sm text-primary font-medium">আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="mb-5">
        <SectionHeader title={title} />
        {Platform.OS === "web" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {Array.from({ length: 5 }, (_, index) => <BookCardSkeleton key={index} variant="horizontal" />)}
          </ScrollView>
        ) : <FlatList
          data={Array(5).fill(null)}
          keyExtractor={(_, i) => String(i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => <BookCardSkeleton variant="horizontal" />}
        />}
      </View>
    );
  }

  if (!books.length) return null; // Hide empty sections

  return (
    <View className="mb-5">
      <SectionHeader title={title} seeAllRoute={seeAllRoute} />
      {Platform.OS === "web" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {books.map((item) => <BookCard key={item.id} book={{ ...item, isWishlisted: bookIds.has(item.id) }} variant="horizontal" onWishlistToggle={handleWishlist} />)}
        </ScrollView>
      ) : <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderBookItem}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
      />}
    </View>
  );
}
