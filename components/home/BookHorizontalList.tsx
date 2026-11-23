import { useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
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
  const renderBookItem = useCallback(
    ({ item }: { item: BookCardBook }) => <BookCard book={item} variant="horizontal" />,
    []
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
        <FlatList
          data={Array(5).fill(null)}
          keyExtractor={(_, i) => String(i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => <BookCardSkeleton variant="horizontal" />}
        />
      </View>
    );
  }

  if (!books.length) return null; // Hide empty sections

  return (
    <View className="mb-5">
      <SectionHeader title={title} seeAllRoute={seeAllRoute} />
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderBookItem}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
      />
    </View>
  );
}
