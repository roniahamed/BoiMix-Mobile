import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { BookCard, BookCardSkeleton } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import apiClient from "@/lib/api/client";
import { Colors } from "@/constants/theme";

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 10;

const POPULAR_SEARCH_TAGS = [
  "হুমায়ূন আহমেদ",
  "রবীন্দ্রনাথ ঠাকুর",
  "উপন্যাস",
  "সায়েন্স ফিকশন",
  "ইতিহাস",
  "ইসলামিক",
  "ইংরেজি সাহিত্য",
  "কম্পিউটার ও প্রোগ্রামিং",
];

async function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  const existing: string[] = raw ? JSON.parse(raw) : [];
  const updated = [query.trim(), ...existing.filter((q) => q !== query.trim())].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

async function loadRecentSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function clearRecentSearches() {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<any>(null);
  const params = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(params.q || "");
  const [submittedQuery, setSubmittedQuery] = useState(params.q || "");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);

  // Sync params.q if route changes
  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      setSubmittedQuery(params.q);
    }
  }, [params.q]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches().then((items) => {
      setRecentSearches(items);
      setRecentLoaded(true);
    });
  }, []);

  // Debounced auto-search as user types (350ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSubmittedQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setSubmittedQuery(trimmed);
      saveRecentSearch(trimmed);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Suggestions
  const { data: suggestions } = useQuery({
    queryKey: queryKeys.search.suggestions(query),
    queryFn: () =>
      apiClient.get<{ suggestions: string[] } | string[]>(
        `/search/suggestions/?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length >= 2 && !submittedQuery,
    select: (res) => {
      if (Array.isArray(res.data)) return res.data;
      if (res.data && "suggestions" in res.data && Array.isArray((res.data as any).suggestions)) {
        return (res.data as any).suggestions as string[];
      }
      return [];
    },
  });

  // Search results
  const { data: results, isLoading: resultsLoading, isFetching } = useQuery({
    queryKey: queryKeys.search.books(submittedQuery, {}),
    queryFn: () => booksApi.searchBooks({ q: submittedQuery, page_size: 30 }),
    enabled: submittedQuery.length > 0,
    select: (res) => res.data?.results ?? (Array.isArray(res.data) ? res.data : []),
  });

  const handleSubmit = async (overrideText?: string) => {
    const q = (overrideText ?? query).trim();
    if (!q) return;
    setQuery(q);
    setSubmittedQuery(q);
    await saveRecentSearch(q);
    setRecentSearches(await loadRecentSearches());
  };

  const handleRecentPress = (q: string) => {
    setQuery(q);
    setSubmittedQuery(q);
  };

  const handleClearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const showResults = submittedQuery.length > 0;
  const showSuggestions = query.length >= 2 && !submittedQuery && (suggestions?.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Top Header Search Bar */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 bg-white border-b border-border-light gap-2.5 shadow-xs"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center border border-border-light rounded-2xl px-3.5 h-11 bg-surface-dark">
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            className="flex-1 text-sm text-text-primary ml-2 py-0"
            placeholder="বই, লেখক বা বিষয় খুঁজুন..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSubmit()}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isFetching && (
            <ActivityIndicator size="small" color={Colors.primary} className="mr-1" />
          )}
          {Boolean(query.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setSubmittedQuery("");
              }}
              className="p-1"
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleSubmit()}
          className="px-3.5 py-2.5 bg-primary rounded-xl items-center justify-center"
        >
          <Text className="text-xs font-bold text-white">খুঁজুন</Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <View className="bg-white border-b border-border-light">
          {suggestions!.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleSubmit(s)}
              className="px-5 py-3 flex-row items-center gap-3 border-b border-border-light"
            >
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <Text className="text-sm text-text-primary">{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* When no query is typed: Recent Searches & Popular Tags */}
      {!showResults && !showSuggestions && (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 p-4">
          {recentLoaded && recentSearches.length > 0 && (
            <View className="bg-white rounded-2xl p-4 border border-border-light shadow-xs mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-text-primary">সাম্প্রতিক খোঁজ</Text>
                <TouchableOpacity onPress={handleClearRecent}>
                  <Text className="text-xs font-medium text-error">সব মুছুন</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleRecentPress(q)}
                  className="flex-row items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                >
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text className="text-sm text-text-secondary flex-1" numberOfLines={1}>
                    {q}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRecentSearches((prev) => prev.filter((r) => r !== q))}
                    className="p-1"
                  >
                    <Ionicons name="close" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Search Suggestions Chips */}
          <View className="bg-white rounded-2xl p-4 border border-border-light shadow-xs">
            <View className="flex-row items-center gap-1.5 mb-3">
              <Ionicons name="flame-outline" size={18} color={Colors.primary} />
              <Text className="text-sm font-bold text-text-primary">জনপ্রিয় অনুসন্ধান</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleSubmit(tag)}
                  className="bg-surface-dark border border-border-light px-3.5 py-2 rounded-xl"
                >
                  <Text className="text-xs text-text-secondary font-medium">{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Loading Skeletons for ultra-smooth transition */}
      {showResults && resultsLoading && (
        <View className="p-4 gap-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <View key={idx} className="bg-white p-3 rounded-2xl border border-border-light shadow-xs">
              <BookCardSkeleton variant="list" />
            </View>
          ))}
        </View>
      )}

      {/* Results List */}
      {showResults && !resultsLoading && (
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => <BookCard book={item} variant="list" />}
          ListEmptyComponent={
            <View className="items-center py-20 bg-white rounded-2xl border border-border-light mx-4 my-8 p-6">
              <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
                <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary">বই পাওয়া যায়নি</Text>
              <Text className="text-xs text-text-muted mt-1 text-center max-w-xs">
                "{submittedQuery}" সম্পর্কিত কোনো বই এই মুহূর্তে পাওয়া যায়নি। বানান পরিবর্তন করে আবার চেষ্টা করুন।
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
