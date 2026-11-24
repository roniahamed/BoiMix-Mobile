import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { useBookFeedWarmup } from "@/hooks/useBookFeedWarmup";
import { Colors } from "@/constants/theme";
import { AddToCartButton } from "@/components/shared/AddToCartButton";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { resolveMediaUrl } from "@/lib/utils/media";
import { useCartStore } from "@/stores/cart-store";
import type { BookCardBook, BookCategory } from "@/types/book";

function categoryName(category: BookCategory) {
  return category.nameBn || (category as BookCategory & { name_bn?: string }).name_bn || category.name;
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

  const categories = useQuery({
    queryKey: queryKeys.books.categories(),
    queryFn: () => booksApi.getAllCategories(),
  });
  const books = useInfiniteQuery({
    queryKey: ["category-browser", selected],
    queryFn: ({ pageParam }) => booksApi.getBooks({ category: selected || undefined, ordering: "-created_at", page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => last.data.next ? pages.length + 1 : undefined,
  });
  useBookFeedWarmup(books);
  const selectedName = categories.data?.find((category) => category.slug === selected);
  const title = selectedName ? categoryName(selectedName) : "সব বই";
  const items = books.data?.pages.flatMap((page) => page.data.results) ?? [];

  const renderBook = ({ item }: { item: BookCardBook }) => {
    const cover = resolveMediaUrl(item.coverUrl || (item as any).cover_image_url || (item as any).cover_image || (item as any).image);
    return (
      <View style={{ width: "100%", padding: 4 }}>
        <TouchableOpacity onPress={() => router.push(`/book/${item.slug || item.id}` as never)} activeOpacity={0.85} className="bg-white rounded-xl border border-border-light overflow-hidden h-full">
          <View className="bg-surface-dark items-center justify-center" style={{ height: 145 }}>
            {cover ? <Image source={{ uri: cover }} style={{ width: "100%", height: "100%" }} contentFit="contain" cachePolicy="memory-disk" /> : <Ionicons name="book-outline" size={34} color={Colors.textMuted} />}
          </View>
          <View className="p-2 flex-1">
            <Text className="text-sm font-bold text-text-primary" numberOfLines={2}>{item.title}</Text>
            <Text className="text-xs text-text-secondary mt-1" numberOfLines={1}>{item.author}</Text>
            <Text className="text-sm font-bold text-primary mt-2">{item.availabilityMode === "borrow" ? "ধার" : item.availabilityMode === "exchange" ? "বিনিময়" : Number(item.price) > 0 ? `৳${item.price}` : "বিনামূল্যে"}</Text>
            <AddToCartButton book={item} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-surface-dark">
      <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-3 flex-row items-center bg-surface-dark border-b border-border-light">
        <Text className="flex-1 text-xl font-bold text-secondary">ক্যাটাগরি</Text>
        <TouchableOpacity onPress={() => router.push("/search")} accessibilityRole="button" accessibilityLabel="বই খুঁজুন" className="w-11 h-11 items-center justify-center"><Ionicons name="search-outline" size={24} color={Colors.secondary} /></TouchableOpacity>
        <View><TouchableOpacity onPress={() => router.push("/cart")} accessibilityRole="button" accessibilityLabel="কার্ট" className="w-11 h-11 items-center justify-center"><Ionicons name="cart-outline" size={24} color={Colors.secondary} /></TouchableOpacity>{cartCount > 0 && <View className="absolute top-0 right-0 bg-error rounded-full min-w-[18px] h-[18px] items-center justify-center px-1"><Text className="text-white text-[10px] font-bold">{cartCount > 9 ? "9+" : cartCount}</Text></View>}</View>
      </View>
      <View className="flex-1 flex-row">
        <View className="w-24 bg-white border-r border-border-light">
          {categories.isLoading ? <ActivityIndicator color={Colors.primary} className="mt-6" /> : categories.isError ? <TouchableOpacity onPress={() => categories.refetch()} className="p-2"><Text className="text-xs text-primary text-center">আবার চেষ্টা করুন</Text></TouchableOpacity> : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {[null, ...(categories.data ?? [])].map((category) => {
                const active = selected === (category?.slug ?? null);
                return <TouchableOpacity key={category?.id ?? "all"} onPress={() => setSelected(category?.slug ?? null)} accessibilityRole="button" accessibilityState={{ selected: active }} className={`items-center justify-center px-2 py-4 border-b border-border-light ${active ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}>
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center mb-1.5 ${active ? "bg-white" : "bg-surface-dark"}`}><Ionicons name={category ? "book-outline" : "library-outline"} size={22} color={active ? Colors.primary : Colors.secondary} /></View>
                  <Text className={`text-xs text-center ${active ? "font-bold text-primary" : "text-text-primary"}`} numberOfLines={3}>{category ? categoryName(category) : "সব বই"}</Text>
                </TouchableOpacity>;
              })}
            </ScrollView>
          )}
        </View>
        <View className="flex-1">
          {books.isLoading ? <ActivityIndicator color={Colors.primary} className="mt-12" /> : books.isError && !books.data ? <View className="flex-1 items-center justify-center p-4"><Text className="text-text-secondary text-center mb-3">বই লোড করা যায়নি</Text><TouchableOpacity onPress={() => books.refetch()}><Text className="text-primary font-bold">আবার চেষ্টা করুন</Text></TouchableOpacity></View> : (
            <FlashList
              key={selected ?? "all"} data={items} keyExtractor={(item) => item.id} numColumns={2} masonry drawDistance={600} optimizeItemArrangement={false} renderItem={renderBook}
              contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={<View className="mb-2"><TouchableOpacity onPress={() => router.push("/search")} className="rounded-2xl overflow-hidden mb-4" style={{ height: 112 }}><Image source={require("@/assets/banners/marketplace-hero-green.jpg")} style={{ width: "100%", height: "100%", position: "absolute" }} contentFit="cover" /><View className="justify-center px-3 h-full" style={{ width: "60%" }}><Text className="text-secondary text-base font-bold">পছন্দের বই খুঁজে নিন</Text><Text className="text-primary text-xs font-bold mt-2">বই দেখুন  →</Text></View></TouchableOpacity><View className="bg-primary/10 rounded-xl px-3 py-3 border-l-4 border-primary"><Text className="font-bold text-secondary">{title}</Text><Text className="text-xs text-text-secondary mt-1">{books.data?.pages[0]?.data.count ?? 0}টি বই</Text></View></View>}
              ListEmptyComponent={<Text className="text-text-secondary text-center mt-10">এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি</Text>}
              onEndReached={() => { if (books.hasNextPage && !books.isFetching && !books.isFetchNextPageError) books.fetchNextPage({ cancelRefetch: false }); }} onEndReachedThreshold={2}
              ListFooterComponent={books.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} className="my-4" /> : books.isFetchNextPageError ? <TouchableOpacity onPress={() => books.fetchNextPage()} className="items-center py-4"><Text className="text-primary">আবার চেষ্টা করুন</Text></TouchableOpacity> : undefined}
            />
          )}
        </View>
      </View>
    </View>
  );
}
