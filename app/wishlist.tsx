import { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { useBookFeedWarmup } from "@/hooks/useBookFeedWarmup";
import { BookCard } from "@/components/shared/BookCard";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { booksApi } from "@/lib/api/books";
import { wishlistApi } from "@/lib/api/wishlist";
import { toggleWishlist } from "@/lib/wishlist-sync";
import { requestWishlistRefresh } from "@/lib/cart-sync-events";
import { queryKeys } from "@/lib/api/query-keys";
import { resolveMediaUrl } from "@/lib/utils/media";
import { Colors } from "@/constants/theme";
import type { BookCardBook } from "@/types/book";

const PAGE_SIZE = 20;

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { bookIds, clearWishlist, scopeId, syncPending: wishlistSyncPending, syncError: wishlistSyncError } = useWishlistStore();
  const ids = useMemo(() => Array.from(bookIds), [bookIds]);
  const prefetched = useRef(new Set<string>());

  const server = useInfiniteQuery({
    queryKey: [...queryKeys.me.wishlist(), user?.id],
    queryFn: async ({ pageParam }) => {
      try {
        const { data } = await wishlistApi.getWishlistItems(pageParam, PAGE_SIZE);
        return { data: { count: data.count, next: data.next, results: data.results.map((item) => item.book).filter(Boolean) } };
      } catch (error: any) {
        // Older deployments have POST-only /items/; preserve their existing wishlist support.
        if (pageParam !== 1 || error?.response?.status !== 405) throw error;
        const { data } = await wishlistApi.getWishlist();
        return { data: { count: data.total_items, next: null, results: data.items.map((item) => item.book).filter(Boolean) } };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (last, pages) => last.data.next ? pages.length + 1 : undefined,
    enabled: !!user,
  });
  // Guest favorites only store IDs; resolve them in small pages instead of scanning the first 50 catalog books.
  const guest = useInfiniteQuery({
    queryKey: [...queryKeys.me.wishlist(), "guest", ids],
    queryFn: async ({ pageParam }) => {
      const batch = ids.slice(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE);
      const results = await Promise.all(batch.map(async (id) => {
        try {
          const response = await booksApi.getBookDetail(id);
          return ("book" in response.data ? response.data.book : response.data) as BookCardBook;
        } catch (error: any) {
          if (error?.response?.status === 404) return null;
          throw error;
        }
      }));
      return { data: { results: results.filter((book): book is BookCardBook => book !== null) } };
    },
    initialPageParam: 0,
    getNextPageParam: (_last, pages) => pages.length * PAGE_SIZE < ids.length ? pages.length : undefined,
    enabled: !user && scopeId === null && ids.length > 0,
  });
  const activeFeed = user ? server : guest;
  const books = useMemo(() => (activeFeed.data?.pages.flatMap((page) => page.data.results) ?? []).filter((book) => bookIds.has(book.id)), [activeFeed.data, bookIds]);
  const scopeMatches = scopeId === (user?.id ?? null);
  const count = scopeMatches ? ids.length : 0;
  const isLoading = !scopeMatches || (user ? server.isLoading || wishlistSyncPending : ids.length > 0 && guest.isLoading);
  const isError = user ? wishlistSyncError || (server.isError && !server.data) : guest.isError && !guest.data;

  const warmCovers = useCallback((items: BookCardBook[]) => {
    const urls = items.map((book) => {
      const raw = book as BookCardBook & { cover_image_url?: string; cover_image?: string; coverImage?: string; image?: string };
      return resolveMediaUrl(raw.coverUrl || raw.cover_image_url || raw.cover_image || raw.coverImage || raw.image);
    }).filter((url) => url && !prefetched.current.has(url));
    if (urls.length) {
      urls.forEach((url) => prefetched.current.add(url));
      Image.prefetch(urls, "disk").then((success) => { if (!success) urls.forEach((url) => prefetched.current.delete(url)); }).catch(() => { urls.forEach((url) => prefetched.current.delete(url)); });
    }
  }, []);
  useEffect(() => { warmCovers(books.slice(0, 16)); }, [books, warmCovers]);
  useBookFeedWarmup(activeFeed);
  const booksRef = useRef(books);
  useEffect(() => { booksRef.current = books; }, [books]);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    const last = Math.max(-1, ...viewableItems.map((item) => item.index ?? -1));
    if (last >= 0) warmCovers(booksRef.current.slice(last + 1, last + 13));
  }, [warmCovers]);

  const handleRemove = (bookId: string) => toggleWishlist(bookId);
  const reload = () => { if (user) { requestWishlistRefresh(); server.refetch(); } else guest.refetch(); };

  return (
    <View className="flex-1 bg-surface-dark">
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-border-light shadow-sm">
        <View className="flex-row items-center gap-3"><TouchableOpacity onPress={() => router.back()} className="p-1"><Ionicons name="arrow-back" size={22} color={Colors.textPrimary} /></TouchableOpacity><View><Text className="text-lg font-bold text-text-primary">আমার উইশলিস্ট</Text><Text className="text-xs text-text-secondary">{count}টি পছন্দের বই</Text></View></View>
        {!user && count > 0 && <TouchableOpacity onPress={clearWishlist} className="px-2 py-1"><Text className="text-xs text-error font-medium">সব মুছুন</Text></TouchableOpacity>}
      </View>
      {isLoading ? <View className="flex-1 items-center justify-center"><ActivityIndicator color={Colors.primary} /><Text className="text-xs text-text-muted mt-2">বই লোড হচ্ছে...</Text></View> : isError ? <View className="flex-1 items-center justify-center px-6"><Text className="text-sm text-text-secondary mb-3">লোড করতে সমস্যা হয়েছে</Text><Button label="আবার চেষ্টা করুন" onPress={reload} fullWidth={false} /></View> : count === 0 ? <View className="flex-1 items-center justify-center px-6"><View className="w-20 h-20 rounded-full bg-surface-card border border-border items-center justify-center mb-4"><Ionicons name="heart-outline" size={38} color={Colors.textMuted} /></View><Text className="text-lg font-bold text-text-primary">উইশলিস্ট খালি আছে</Text><Text className="text-sm text-text-secondary text-center mt-1 mb-6">আপনার পছন্দের বই খুঁজে এখানে রাখুন</Text><Button label="বই খুঁজুন" onPress={() => router.push("/tabs/explore")} fullWidth={false} /></View> : (
        <FlashList data={books} keyExtractor={(item) => item.id} numColumns={2} masonry drawDistance={600} optimizeItemArrangement={false} contentContainerStyle={{ padding: 12, paddingTop: 16 }}
          renderItem={({ item }) => <View className="px-1"><BookCard book={{ ...item, isWishlisted: true }} variant="grid" onWishlistToggle={() => handleRemove(item.id)} /></View>}
          onViewableItemsChanged={onViewableItemsChanged} onEndReached={() => { if (activeFeed.hasNextPage && !activeFeed.isFetching && !activeFeed.isFetchNextPageError) activeFeed.fetchNextPage({ cancelRefetch: false }); }} onEndReachedThreshold={2}
          ListEmptyComponent={<Text className="text-text-secondary text-center py-8">সংরক্ষিত বই এখন পাওয়া যাচ্ছে না</Text>}
          ListFooterComponent={activeFeed.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} className="my-4" /> : activeFeed.isFetchNextPageError ? <TouchableOpacity onPress={() => activeFeed.fetchNextPage()} className="items-center py-4"><Text className="text-primary font-bold">আরও বই লোড হয়নি · আবার চেষ্টা করুন</Text></TouchableOpacity> : undefined} showsVerticalScrollIndicator={false} />
      )}
    </View>
  );
}
