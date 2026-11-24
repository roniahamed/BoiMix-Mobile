import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { HeroBanner } from "@/components/home/HeroBanner";
import { BookCard } from "@/components/shared/BookCard";
import type { BookCardBook } from "@/types/book";
import { BookHorizontalList } from "@/components/home/BookHorizontalList";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { Colors } from "@/constants/theme";
import { useBookFeedWarmup } from "@/hooks/useBookFeedWarmup";
import { useCartStore } from "@/stores/cart-store";

const MOCK_BANNERS = [
  {
    id: "1",
    imageUrl: require("@/assets/banners/marketplace-hero-green.jpg"),
    title: "নতুন ও পুরাতন বইয়ের বিশ্বস্ত বাজার",
    subtitle: "পছন্দের বই খুঁজুন, কিনুন বা নিজের বই বিক্রি করুন",
  },
  {
    id: "2",
    imageUrl: require("@/assets/banners/marketplace-hero-green.jpg"),
    title: "বই বিনিময় করুন",
    subtitle: "কাছের পাঠকদের সাথে সরাসরি",
  },
  {
    id: "3",
    imageUrl: require("@/assets/banners/marketplace-hero-green.jpg"),
    title: "বইমেলা উৎসব অফার",
    subtitle: "বিশেষ ছাড়ে সেরা বই সংগ্রহ করুন",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listRef = useRef<FlashListRef<BookCardBook>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const { data: trendingData, isLoading: trendingLoading, isError: trendingError, refetch: refetchTrending } = useQuery({
    queryKey: queryKeys.books.trending(),
    queryFn: () => booksApi.getBooks({ ordering: "-rating", page_size: 10 }),
    select: (res) => res.data?.results ?? (Array.isArray(res.data) ? res.data : []),
  });

  const { data: newData, isLoading: newLoading, isError: newError, refetch: refetchNew } = useQuery({
    queryKey: queryKeys.books.newArrivals(),
    queryFn: () => booksApi.getBooks({ ordering: "-created_at", page_size: 10 }),
    select: (res) => res.data?.results ?? (Array.isArray(res.data) ? res.data : []),
  });

  const { data: nearbyData, isLoading: nearbyLoading, isError: nearbyError, refetch: refetchNearby } = useQuery({
    queryKey: userLocation ? queryKeys.books.nearby(userLocation.lat, userLocation.lng, 10) : ["books", "nearby", "none"],
    queryFn: () => userLocation ? booksApi.getNearbyBooks(userLocation.lat, userLocation.lng, 10) : Promise.reject("no-location"),
    enabled: !!userLocation,
    select: (res) => res.data?.results ?? (Array.isArray(res.data) ? res.data : []),
  });

  const { data: libraryData, isLoading: libraryLoading, isError: libraryError, refetch: refetchLibrary } = useQuery({
    queryKey: queryKeys.books.list({ provider_type: "library" }),
    queryFn: () => booksApi.getBooks({ provider_type: "library", page_size: 8 }),
    select: (res) => res.data?.results ?? (Array.isArray(res.data) ? res.data : []),
  });

  const feed = useInfiniteQuery({
    queryKey: ["home-feed"],
    queryFn: ({ pageParam }) => booksApi.getBooks({ ordering: "-created_at", page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => last.data.next ? pages.length + 1 : undefined,
  });
  const feedBooks = useMemo(() => feed.data?.pages.flatMap((page) => page.data.results) ?? [], [feed.data]);
  useBookFeedWarmup(feed);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.books.categories(),
    queryFn: () => booksApi.getAllCategories(),
  });

  const requestLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocationDenied(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocationDenied(false);
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert("লোকেশন পাওয়া যায়নি", "লোকেশন চালু আছে কিনা দেখে আবার চেষ্টা করুন।");
    } finally {
      setLocating(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchTrending(), refetchNew(), refetchLibrary(), queryClient.resetQueries({ queryKey: ["home-feed"] }), ...(userLocation ? [refetchNearby()] : [])]);
    setRefreshing(false);
  }, [refetchTrending, refetchNew, refetchNearby, refetchLibrary, userLocation, queryClient]);

  return (
    <View className="flex-1 bg-surface-dark">
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMenuOpen(false)} accessibilityLabel="মেনু বন্ধ করুন" />
          <View className="bg-white rounded-t-3xl p-5" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row justify-between items-center mb-4"><Text className="text-xl font-bold text-secondary">মেনু</Text><TouchableOpacity onPress={() => setMenuOpen(false)} accessibilityLabel="মেনু বন্ধ করুন"><Ionicons name="close" size={26} color={Colors.textPrimary} /></TouchableOpacity></View>
            {([ ["অ্যাকাউন্ট", "/tabs/profile", "person-outline"], ["মেসেজ", "/messages", "chatbubble-ellipses-outline"], ["নোটিফিকেশন", "/notifications", "notifications-outline"], ["সেটিংস", "/settings", "settings-outline"] ] as const).map(([label, route, icon]) => <TouchableOpacity key={route} onPress={() => { setMenuOpen(false); router.push(route as never); }} className="flex-row items-center py-3 border-b border-border-light"><Ionicons name={icon} size={21} color={Colors.primary} /><Text className="text-base text-text-primary ml-3">{label}</Text></TouchableOpacity>)}
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-3 bg-surface-dark">
        <TouchableOpacity onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="মেনু খুলুন" className="w-11 h-11 items-center justify-center">
          <Ionicons name="menu-outline" size={29} color={Colors.secondary} />
        </TouchableOpacity>
        <View className="flex-1 ml-1"><Image source={require("@/assets/images/boimix-logo.png")} style={{ width: "100%", maxWidth: 125, height: 42 }} contentFit="contain" contentPosition="left" accessibilityLabel="BoiMix" /></View>
        <TouchableOpacity onPress={() => router.push("/search" as never)} accessibilityRole="button" accessibilityLabel="বই খুঁজুন" className="w-11 h-11 items-center justify-center"><Ionicons name="search-outline" size={24} color={Colors.secondary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/wishlist" as never)} accessibilityRole="button" accessibilityLabel="পছন্দের বই" className="w-11 h-11 items-center justify-center">
          <Ionicons name="heart-outline" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <View>
          <TouchableOpacity onPress={() => router.push("/cart" as never)} accessibilityRole="button" accessibilityLabel="কার্ট" className="w-11 h-11 items-center justify-center">
            <Ionicons name="cart-outline" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          {cartCount > 0 && <View className="absolute top-0 right-0 bg-error min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"><Text className="text-[10px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text></View>}
        </View>
      </View>

      <FlashList
        ref={listRef}
        className="flex-1"
        data={feedBooks}
        keyExtractor={(item) => item.id}
        numColumns={2}
        drawDistance={600}
        masonry
        optimizeItemArrangement={false}
        renderItem={({ item }) => <View className="px-1"><BookCard book={item} variant="grid" /></View>}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        onEndReached={() => { if (feed.hasNextPage && !feed.isFetching && !feed.isFetchNextPageError) feed.fetchNextPage({ cancelRefetch: false }); }}
        onEndReachedThreshold={2}
        onScroll={(event) => setShowScrollTop(event.nativeEvent.contentOffset.y > 500)}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        ListHeaderComponent={<View>
      {/* Hero Banner */}
      <View className="mt-4"><HeroBanner items={MOCK_BANNERS} /></View>

      {/* Categories */}
      <CategoryCarousel categories={categoriesData ?? []} />

      <BookHorizontalList title="নতুন সংযোজিত বই" books={newData ?? []} loading={newLoading} error={newError} onRetry={refetchNew} seeAllRoute="/search" />
      <TouchableOpacity onPress={() => router.push("/tabs/sell" as never)} activeOpacity={0.85} className="mx-4 mb-6 rounded-2xl overflow-hidden" style={{ height: 125 }}>
        <Image source={require("@/assets/banners/sell-books-green.jpg")} contentFit="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
        <View className="p-4 justify-center h-full" style={{ width: "57%" }}>
          <Text className="text-lg font-bold text-secondary leading-6">নিজের বই বিক্রি করুন</Text>
          <Text className="text-xs text-text-primary mt-1" numberOfLines={2}>পুরাতন বা অব্যবহৃত বই সহজেই লিস্ট করুন</Text>
          <View className="bg-primary rounded-full self-start px-3 py-1.5 mt-2"><Text className="text-white text-xs font-bold">বই বিক্রি করুন  →</Text></View>
        </View>
      </TouchableOpacity>
      <BookHorizontalList title="জনপ্রিয় বই" books={trendingData ?? []} loading={trendingLoading} error={trendingError} onRetry={refetchTrending} seeAllRoute="/search" />

      {!userLocation ? (
        <View className="bg-white mx-4 rounded-2xl p-4 mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
            <Ionicons name="location-outline" size={24} color={Colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-primary">আপনার কাছের বই</Text>
            <Text className="text-xs text-text-secondary mt-1">{locationDenied ? "লোকেশন অনুমতি দিয়ে আশেপাশের বই খুঁজুন" : "আশেপাশের পাঠক ও বই আবিষ্কার করুন"}</Text>
            <TouchableOpacity onPress={requestLocation} disabled={locating} accessibilityRole="button" className="mt-2 self-start">
              <Text className="text-sm text-primary font-bold">{locating ? "লোকেশন খোঁজা হচ্ছে..." : "লোকেশন চালু করুন  →"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <BookHorizontalList title="কাছের বই" books={nearbyData ?? []} loading={nearbyLoading && !!userLocation} error={nearbyError} onRetry={refetchNearby} seeAllRoute="/near-me" />
      )}

      <BookHorizontalList title="কেন্দ্রীয় লাইব্রেরি" books={libraryData ?? []} loading={libraryLoading} error={libraryError} onRetry={refetchLibrary} seeAllRoute="/search" />

          <View className="px-4 mb-3"><Text className="text-lg font-bold text-secondary">আরও বই খুঁজুন</Text></View>
        </View>}
        ListEmptyComponent={feed.isLoading ? <ActivityIndicator color={Colors.primary} className="my-6" /> : feed.isError ? <TouchableOpacity onPress={() => feed.refetch()} className="items-center py-6"><Text className="text-primary font-semibold">বই লোড হয়নি · আবার চেষ্টা করুন</Text></TouchableOpacity> : <Text className="text-text-secondary text-center py-6">আর কোনো বই পাওয়া যায়নি</Text>}
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} className="my-6" /> : feed.isFetchNextPageError ? <TouchableOpacity onPress={() => feed.fetchNextPage()} className="items-center py-6"><Text className="text-primary font-semibold">আরও বই লোড হয়নি · আবার চেষ্টা করুন</Text></TouchableOpacity> : <View style={{ height: insets.bottom + 16 }} />}
      />
      {showScrollTop && <TouchableOpacity onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} accessibilityRole="button" accessibilityLabel="উপরে যান" className="absolute right-4 bottom-5 w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg"><Ionicons name="arrow-up" size={24} color="white" /></TouchableOpacity>}
    </View>
  );
}
