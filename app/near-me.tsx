import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { booksApi } from "@/lib/api/books";
import { BookCard } from "@/components/shared/BookCard";
import type { BookCardBook, BookAvailabilityMode } from "@/types/book";

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const MODE_OPTIONS: { label: string; value: BookAvailabilityMode | null }[] = [
  { label: "সব বই", value: null },
  { label: "বিক্রয়", value: "sell" },
  { label: "ধার", value: "borrow" },
  { label: "বিনিময়", value: "exchange" },
];

export default function NearMeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Location state (defaulting to Dhaka center coords if denied)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationName, setLocationName] = useState("ঢাকা (ডিফল্ট)");
  const [locating, setLocating] = useState(false);

  // Filters
  const [radius, setRadius] = useState<number>(25);
  const [selectedMode, setSelectedMode] = useState<BookAvailabilityMode | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const requestLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        // Fallback to Dhaka
        setCoords({ lat: 23.8103, lng: 90.4125 });
        setLocationName("ঢাকা (ডিফল্ট)");
        return;
      }
      setPermissionDenied(false);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setLocationName("আপনার বর্তমান অবস্থান");
    } catch {
      setCoords({ lat: 23.8103, lng: 90.4125 });
      setLocationName("ঢাকা (ডিফল্ট)");
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch nearby books
  const {
    data: booksData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["books", "nearby-screen", coords?.lat, coords?.lng, radius],
    queryFn: async () => {
      if (!coords) return [];
      const res = await booksApi.getNearbyBooks(coords.lat, coords.lng, radius);
      return res.data?.results ?? [];
    },
    enabled: !!coords,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const books: BookCardBook[] = (booksData ?? []).filter((b) => {
    if (!selectedMode) return true;
    return b.availabilityMode === selectedMode;
  });

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Top Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-white px-4 pb-3 border-b border-border-light shadow-sm"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text className="text-lg font-bold text-text-primary">কাছের বই</Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="location-sharp" size={12} color={Colors.primary} />
                <Text className="text-xs text-text-secondary ml-1" numberOfLines={1}>
                  {locationName} • {radius} কিমি ব্যাসার্ধ
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={requestLocation}
            className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="locate" size={18} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Radius Chips */}
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="text-xs text-text-muted mr-1 font-medium">দূরত্ব:</Text>
          {RADIUS_OPTIONS.map((r) => {
            const active = radius === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRadius(r)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? "bg-primary border-primary" : "bg-white border-border-light"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-white" : "text-text-primary"
                  }`}
                >
                  {r} কিমি
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mode Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 -mx-4 px-4"
        >
          <View className="flex-row gap-2">
            {MODE_OPTIONS.map((m) => {
              const active = selectedMode === m.value;
              return (
                <TouchableOpacity
                  key={m.label}
                  onPress={() => setSelectedMode(m.value)}
                  className={`px-3 py-1 rounded-lg border ${
                    active ? "bg-secondary border-secondary" : "bg-surface-dark border-border-light"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      active ? "text-white" : "text-text-secondary"
                    }`}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Permission alert if denied */}
      {permissionDenied && (
        <View className="bg-warning/15 border-b border-warning/30 px-4 py-2.5 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
            <Text className="text-xs text-text-primary ml-2 flex-1">
              সঠিক দূরত্বের জন্য লোকেশন পারমিশন দিন
            </Text>
          </View>
          <TouchableOpacity onPress={requestLocation}>
            <Text className="text-xs font-bold text-primary">অনুমতি দিন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Book List / States */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-sm text-text-muted mt-3">আশেপাশের বই খোঁজা হচ্ছে...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textMuted} />
          <Text className="text-base font-bold text-text-primary mt-3">লোড করা যায়নি</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 px-5 py-2.5 bg-primary rounded-xl"
          >
            <Text className="text-white text-xs font-bold">পুনরায় চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <View className="mb-3">
              <BookCard book={item} variant="list" />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-20 px-6">
              <View className="w-16 h-16 rounded-full bg-surface-card border border-border items-center justify-center mb-3">
                <Ionicons name="location-outline" size={30} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary text-center">
                এই দূরত্বের মধ্যে কোনো বই নেই
              </Text>
              <Text className="text-xs text-text-secondary text-center mt-1">
                ব্যাসার্ধ বাড়িয়ে ২০ বা ৫০ কিমি নির্বাচন করে দেখতে পারেন
              </Text>
              <TouchableOpacity
                onPress={() => setRadius(50)}
                className="mt-4 px-4 py-2 bg-primary/10 rounded-xl"
              >
                <Text className="text-xs font-bold text-primary">৫০ কিমি ব্যাসার্ধ দেখুন</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
