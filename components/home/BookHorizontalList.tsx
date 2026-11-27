import { memo, useCallback } from "react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { toggleWishlist } from "@/lib/wishlist-sync";
import { View, FlatList, Platform, ScrollView, Text, TouchableOpacity } from "react-native";
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

export const BookHorizontalList = memo(function BookHorizontalList({
  title,
  books,
  loading,
  error,
  onRetry,
  seeAllRoute,
}: Props) {
  const bookIds = useWishlistStore((state) => state.bookIds);
  const scopeId = useWishlistStore((state) => state.scopeId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const handleWishlist = useCallback((id: string) => toggleWishlist(id), []);
  const renderBookItem = useCallback(
    ({ item }: { item: BookCardBook }) => <BookCard book={{ ...item, isWishlisted: scopeId === userId && bookIds.has(item.id) }} variant="horizontal" onWishlistToggle={handleWishlist} />,
    [bookIds, scopeId, userId, handleWishlist]
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
          {books.map((item) => <BookCard key={item.id} book={{ ...item, isWishlisted: scopeId === userId && bookIds.has(item.id) }} variant="horizontal" onWishlistToggle={handleWishlist} />)}
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
});
