import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";

import { BookCard } from "@/components/shared/BookCard";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { booksApi } from "@/lib/api/books";
import { wishlistApi } from "@/lib/api/wishlist";
import { queryKeys } from "@/lib/api/query-keys";
import { Colors } from "@/constants/theme";
import type { BookCardBook } from "@/types/book";

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { bookIds, removeBook, clearWishlist } = useWishlistStore();
  const idsArray = Array.from(bookIds);

  const { data: books, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.me.wishlist(),
    queryFn: async () => {
      if (user) {
        try {
          const res = await wishlistApi.getWishlist();
          if (res.data?.results && res.data.results.length > 0) {
            return res.data.results;
          }
        } catch {
          // Fallback to local filtering
        }
      }
      if (idsArray.length === 0) return [];
      const res = await booksApi.getBooks({ page_size: 50 });
      return res.data.results.filter((b) => bookIds.has(b.id));
    },
  });

  const handleRemove = async (bookId: string) => {
    removeBook(bookId);
    try {
      await wishlistApi.removeItem(bookId);
    } catch {
      // Local removal succeeded
    }
    refetch();
  };

  const displayBooks = books ?? [];

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-border-light shadow-sm"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-text-primary">আমার উইশলিস্ট</Text>
            <Text className="text-xs text-text-secondary">
              {idsArray.length}টি পছন্দের বই
            </Text>
          </View>
        </View>

        {idsArray.length > 0 && (
          <TouchableOpacity onPress={clearWishlist} className="px-2 py-1">
            <Text className="text-xs text-error font-medium">সব মুছুন</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {idsArray.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-surface-card border border-border items-center justify-center mb-4">
            <Ionicons name="heart-outline" size={38} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-bold text-text-primary">উইশলিস্ট খালি আছে</Text>
          <Text className="text-sm text-text-secondary text-center mt-1 mb-6">
            পছন্দের বইগুলো এখানে সংরক্ষণ করে রাখুন
          </Text>
          <Button
            label="বই খুঁজুন"
            onPress={() => router.push("/tabs/explore" as never)}
            fullWidth={false}
          />
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
          <Text className="text-xs text-text-muted mt-2">বই লোড হচ্ছে...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-text-secondary mb-3">লোড করতে সমস্যা হয়েছে</Text>
          <Button label="আবার চেষ্টা করুন" onPress={() => refetch()} fullWidth={false} />
        </View>
      ) : (
        <FlashList
          data={displayBooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingTop: 16 }}
          renderItem={({ item }: { item: BookCardBook }) => (
            <View className="px-1">
              <BookCard
                book={{ ...item, isWishlisted: true }}
                variant="grid"
                onWishlistToggle={() => handleRemove(item.id)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
