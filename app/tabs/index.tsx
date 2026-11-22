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

  const { data: trendingData, isLoading: trendingLoading, isError: trendingError, refetch: refetchTrending } = useQuery({
    queryKey: queryKeys.books.trending(),
    queryFn: () => booksApi.getBooks({ ordering: "-rating", page_size: 10 }),
    select: (res) => res.data.results,
  });

  const { data: newData, isLoading: newLoading, isError: newError, refetch: refetchNew } = useQuery({
    queryKey: queryKeys.books.newArrivals(),
    queryFn: () => booksApi.getBooks({ ordering: "-created_at", page_size: 10 }),
    select: (res) => res.data.results,
  });

  const { data: nearbyData, isLoading: nearbyLoading, isError: nearbyError, refetch: refetchNearby } = useQuery({
    queryKey: userLocation ? queryKeys.books.nearby(userLocation.lat, userLocation.lng, 10) : ["books", "nearby", "none"],
    queryFn: () => userLocation ? booksApi.getNearbyBooks(userLocation.lat, userLocation.lng, 10) : Promise.reject("no-location"),
    enabled: !!userLocation,
    select: (res) => res.data.results,
  });

  const { data: libraryData, isLoading: libraryLoading, isError: libraryError, refetch: refetchLibrary } = useQuery({
    queryKey: queryKeys.books.list({ provider_type: "library" }),
    queryFn: () => booksApi.getBooks({ provider_type: "library", page_size: 8 }),
    select: (res) => res.data.results,
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
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.push("/search" as never)} className="w-10 h-10 bg-surface-dark rounded-xl items-center justify-center">
            <Ionicons name="search-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/notifications" as never)} className="w-10 h-10 bg-surface-dark rounded-xl items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/cart" as never)} className="w-10 h-10 bg-surface-dark rounded-xl items-center justify-center">
            <Ionicons name="cart-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
