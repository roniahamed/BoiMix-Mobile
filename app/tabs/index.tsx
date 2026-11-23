import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { HeroBanner } from "@/components/home/HeroBanner";
import { BookHorizontalList } from "@/components/home/BookHorizontalList";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { Colors } from "@/constants/theme";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { notificationsApi } from "@/lib/api/notifications";

const QUICK_ACTIONS = [
  { label: "বিক্রয়", iconName: "pricetag-outline" as const, mode: "sell" },
  { label: "বিনিময়", iconName: "repeat-outline" as const, mode: "exchange" },
  { label: "ধার", iconName: "book-outline" as const, mode: "borrow" },
  { label: "কাছের বই", iconName: "location-outline" as const, mode: "nearby" },
];

const MOCK_BANNERS = [
  {
    id: "1",
    imageUrl: require("@/assets/banners/boimix-hero-banner.jpg"),
    title: "বইয়ের দুনিয়ায় আপনাকে স্বাগতম!",
    subtitle: "লক্ষাধিক বই একটি অ্যাপে",
  },
  {
    id: "2",
    imageUrl: require("@/assets/banners/exchange-community.png"),
    title: "বই বিনিময় করুন",
    subtitle: "কাছের পাঠকদের সাথে সরাসরি",
  },
  {
    id: "3",
    imageUrl: require("@/assets/banners/book-festival.png"),
    title: "বইমেলা উৎসব অফার",
    subtitle: "বিশেষ ছাড়ে সেরা বই সংগ্রহ করুন",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const { data: notifSummary } = useQuery({
    queryKey: ["notifications-summary"],
    queryFn: () => notificationsApi.getSummary(),
    enabled: !!user,
    select: (res) => res.data,
  });
  const unreadNotifs = notifSummary?.unread_notifications_count ?? 0;

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

  const { data: categoriesData } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      try {
        const res = await booksApi.getCategories();
        return res.data?.results?.slice(0, 10) ?? (Array.isArray(res.data) ? (res.data as any).slice(0, 10) : []);
      } catch {
        return [];
      }
    },
  });

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { setLocationDenied(true); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchTrending(), refetchNew(), refetchNearby(), refetchLibrary()]);
    setRefreshing(false);
  }, []);

  const handleQuickAction = (mode: string) => {
    if (mode === "nearby") {
      if (locationDenied) {
        Alert.alert("লোকেশন প্রয়োজন", "কাছের বই দেখতে লোকেশন অনুমতি দিন।",
          [{ text: "না" }, { text: "অনুমতি দিন", onPress: requestLocation }]);
        return;
      }
      router.push("/near-me" as never);
      return;
    }
    if (mode === "sell") {
      router.push("/tabs/sell" as never);
      return;
    }
    router.push({ pathname: "/tabs/explore" as never, params: { mode } });
  };

  return (
    <ScrollView
      className="flex-1 bg-surface-dark"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-border-light">
        <View className="flex-row items-center">
          <Image
            source={require("@/assets/images/boimix-logo.png")}
            style={{ width: 110, height: 34 }}
            contentFit="contain"
          />
        </View>
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity onPress={() => router.push("/search" as never)} className="w-9 h-9 bg-surface-dark rounded-xl items-center justify-center">
            <Ionicons name="search-outline" size={19} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/messages" as never)} className="w-9 h-9 bg-surface-dark rounded-xl items-center justify-center">
            <Ionicons name="chatbubble-ellipses-outline" size={19} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View className="relative">
            <TouchableOpacity onPress={() => router.push("/notifications" as never)} className="w-9 h-9 bg-surface-dark rounded-xl items-center justify-center">
              <Ionicons name="notifications-outline" size={19} color={Colors.textPrimary} />
            </TouchableOpacity>
            {unreadNotifs > 0 ? (
              <View className="absolute -top-1 -right-1 bg-rose-600 min-w-[16px] h-4 rounded-full items-center justify-center px-1 border border-white">
                <Text className="text-[9px] font-bold text-white">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="relative">
            <TouchableOpacity onPress={() => router.push("/cart" as never)} className="w-9 h-9 bg-surface-dark rounded-xl items-center justify-center">
              <Ionicons name="cart-outline" size={19} color={Colors.textPrimary} />
            </TouchableOpacity>
            {cartCount > 0 ? (
              <View className="absolute -top-1 -right-1 bg-primary min-w-[16px] h-4 rounded-full items-center justify-center px-1 border border-white">
                <Text className="text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Top Search Bar */}
      <View className="px-4 py-2 bg-white border-b border-border-light">
        <TouchableOpacity
          onPress={() => router.push("/search" as never)}
          activeOpacity={0.8}
          className="flex-row items-center bg-surface-dark border border-border-light rounded-2xl px-3.5 py-2.5"
        >
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text className="text-xs text-text-muted ml-2.5 flex-1">
            বইয়ের নাম, লেখক বা বিষয় খুঁজুন...
          </Text>
          <View className="bg-primary/10 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-primary">খুঁজুন</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View className="mt-3"><HeroBanner items={MOCK_BANNERS} /></View>

      {/* Quick Actions */}
      <View className="flex-row justify-around bg-white py-3 px-2 mb-3 border-y border-border-light">
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity key={action.mode} onPress={() => handleQuickAction(action.mode)} activeOpacity={0.75} className="items-center px-2">
            <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mb-1.5">
              <Ionicons name={action.iconName} size={22} color={Colors.primary} />
            </View>
            <Text className="text-xs text-text-primary font-medium">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Chips Bar */}
      {categoriesData && categoriesData.length > 0 && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between px-4 mb-2.5">
            <Text className="text-sm font-bold text-text-primary">জনপ্রিয় ক্যাটাগরি</Text>
            <TouchableOpacity onPress={() => router.push("/tabs/explore" as never)}>
              <Text className="text-xs font-bold text-primary">সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {categoriesData.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() =>
                  router.push({
                    pathname: "/category/[slug]",
                    params: {
                      slug: cat.slug,
                      name: cat.name,
                      nameBn: cat.nameBn || (cat as any).name_bn || cat.name,
                    },
                  })
                }
                activeOpacity={0.75}
                className="flex-row items-center bg-white border border-border-light px-3.5 py-2 rounded-2xl shadow-xs"
              >
                <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                  <Ionicons name="book-outline" size={13} color={Colors.primary} />
                </View>
                <Text className="text-xs font-semibold text-text-primary">
                  {cat.nameBn || (cat as any).name_bn || cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <BookHorizontalList title="জনপ্রিয় বই" books={trendingData ?? []} loading={trendingLoading} error={trendingError} onRetry={refetchTrending} seeAllRoute="/tabs/explore" />
      <BookHorizontalList title="নতুন বই" books={newData ?? []} loading={newLoading} error={newError} onRetry={refetchNew} seeAllRoute="/tabs/explore" />

      {locationDenied ? (
        <View className="bg-white mx-4 rounded-xl p-4 mb-5 border border-border">
          <Text className="text-sm font-medium text-text-primary mb-1">কাছের বই দেখুন</Text>
          <Text className="text-xs text-text-secondary mb-3">লোকেশন অনুমতি দিলে আপনার আশেপাশের বই দেখতে পাবেন</Text>
          <TouchableOpacity onPress={requestLocation} className="bg-primary/10 rounded-lg py-2 items-center">
            <Text className="text-sm text-primary font-medium">লোকেশন চালু করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <BookHorizontalList title="কাছের বই" books={nearbyData ?? []} loading={nearbyLoading && !!userLocation} error={nearbyError} onRetry={refetchNearby} seeAllRoute="/near-me" />
      )}

      <BookHorizontalList title="কেন্দ্রীয় লাইব্রেরি" books={libraryData ?? []} loading={libraryLoading} error={libraryError} onRetry={refetchLibrary} seeAllRoute="/tabs/explore" />

      <View style={{ height: insets.bottom + 16 }} />
    </ScrollView>
  );
}
