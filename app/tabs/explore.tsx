import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";

import { SearchBar } from "@/components/explore/SearchBar";
import { FilterBottomSheet } from "@/components/explore/FilterBottomSheet";
import { BookCard, BookCardSkeleton } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { useFilterStore } from "@/stores/filter-store";
import { Colors } from "@/constants/theme";
import type { BookCardBook } from "@/types/book";

const MODE_CHIPS = [
  { label: "সব", value: null },
  { label: "বিক্রয়", value: "sell" },
  { label: "বিনিময়", value: "exchange" },
  { label: "ধার", value: "borrow" },
  { label: "লাইব্রেরি", value: "library" },
] as const;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; category?: string }>();
  const [filterVisible, setFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    searchQuery, setSearchQuery,
    mode, setMode,
    setCategories,
    getActiveFilterCount,
    buildQueryParams,
  } = useFilterStore();

  const [localInput, setLocalInput] = useState(searchQuery);

  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (params.mode) {
      setMode(params.mode as any);
    }
    if (params.category) {
      setCategories([params.category]);
    }
  }, [params.mode, params.category]);

  const queryParams = buildQueryParams();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.search.books(searchQuery, queryParams),
    queryFn: ({ pageParam = 1 }) => {
      const params = { ...queryParams, page: pageParam as number, page_size: 20 };
      if (searchQuery.trim()) {
        return booksApi.searchBooks({ ...params, q: searchQuery });
      }
      return booksApi.getBooks(params);
    },
    getNextPageParam: (last, pages) => {
      return last.data.next ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const books: BookCardBook[] = data?.pages.flatMap((p) => p.data.results) ?? [];
  const totalCount = data?.pages[0]?.data.count ?? 0;

  // Debounced search
  const handleSearch = (text: string) => {
    setLocalInput(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 350);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderBook = useCallback(
    ({ item }: { item: BookCardBook }) => (
      <View className={viewMode === "grid" ? "px-1" : ""}>
        <BookCard book={item} variant={viewMode} />
      </View>
    ),
    [viewMode]
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
          <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
        </View>
        <Text className="text-base font-semibold text-text-primary">কোনো বই পাওয়া যায়নি</Text>
        <Text className="text-sm text-text-secondary text-center mt-1 px-8">
          অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন
        </Text>
        {getActiveFilterCount() > 0 && (
          <TouchableOpacity
            onPress={() => useFilterStore.getState().resetFilters()}
            className="mt-4 bg-primary/10 px-5 py-2 rounded-full"
          >
            <Text className="text-sm text-primary font-medium">ফিল্টার সরিয়ে দিন</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: insets.bottom + 16 }} />;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={Colors.primary} />
        <Text className="text-xs text-text-muted mt-1">আরো লোড হচ্ছে...</Text>
      </View>
    );
  };

  const renderSkeletons = () => (
    <View className="flex-row flex-wrap px-3 pt-2">
      {Array(6).fill(null).map((_, i) => (
        <View key={i} className="px-1 mb-4">
          <BookCardSkeleton variant="grid" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="bg-white px-4 pb-3 border-b border-border-light">
        <SearchBar
          value={localInput}
          onChangeText={handleSearch}
          onClear={() => {
            setLocalInput("");
            setSearchQuery("");
          }}
          onFilterPress={() => setFilterVisible(true)}
          filterCount={getActiveFilterCount()}
        />

        {/* Mode chips */}
        <View className="flex-row mt-3 gap-2">
          {MODE_CHIPS.map((chip) => (
            <TouchableOpacity
              key={String(chip.value)}
              onPress={() => setMode(chip.value as never)}
              activeOpacity={0.8}
              className={`px-3.5 py-1.5 rounded-full border ${
                mode === chip.value
                  ? "bg-primary border-primary"
                  : "bg-surface-dark border-border"
              }`}
            >
              <Text className={`text-xs font-semibold ${mode === chip.value ? "text-white" : "text-text-primary"}`}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results meta */}
      {!isLoading && !isError && (
        <View className="flex-row items-center justify-between px-4 py-2.5">
          <Text className="text-xs font-medium text-text-secondary">
            {totalCount > 0 ? `${totalCount}টি বই পাওয়া গেছে` : ""}
          </Text>
          <View className="flex-row gap-2 bg-white rounded-lg p-1 border border-border-light">
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-primary/10" : ""}`}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === "grid" ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-primary/10" : ""}`}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === "list" ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error */}
      {isError && (
        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-3">
            <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          </View>
          <Text className="text-sm font-semibold text-text-secondary mb-3">বই লোড হয়নি</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-primary/10 px-5 py-2 rounded-full">
            <Text className="text-sm text-primary font-medium">আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading skeletons */}
      {isLoading && renderSkeletons()}

      {/* Book List */}
      {!isLoading && !isError && (
        <FlashList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={viewMode === "grid" ? 2 : 1}
          key={viewMode}
          contentContainerStyle={{ paddingHorizontal: viewMode === "grid" ? 12 : 16, paddingTop: 4 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={() => refetch()}
      />
    </View>
  );
}
