import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { BookCard } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import apiClient from "@/lib/api/client";
import { Colors } from "@/constants/theme";

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 10;

async function saveRecentSearch(query: string) {
  const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  const existing: string[] = raw ? JSON.parse(raw) : [];
  const updated = [query, ...existing.filter((q) => q !== query)].slice(0, MAX_RECENT);
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

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);

  // Load recent searches on mount
  useState(() => {
    loadRecentSearches().then((items) => {
      setRecentSearches(items);
      setRecentLoaded(true);
    });
  });

  // Suggestions
  const { data: suggestions } = useQuery({
    queryKey: queryKeys.search.suggestions(query),
    queryFn: () =>
      apiClient.get<string[]>(`/search/suggestions/?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2 && !submittedQuery,
    select: (res) => res.data,
  });

  // Search results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: queryKeys.search.books(submittedQuery, {}),
    queryFn: () => booksApi.searchBooks({ q: submittedQuery, page_size: 20 }),
    enabled: submittedQuery.length > 0,
    select: (res) => res.data.results,
  });

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
    await saveRecentSearch(query.trim());
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
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center border border-border rounded-xl px-3 h-11 bg-surface-dark">
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} className="mr-2" />
          <TextInput
            ref={inputRef}
            className="flex-1 text-base text-text-primary ml-2"
            placeholder="বই, লেখক বা বিষয় খুঁজুন..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={(text) => { setQuery(text); if (submittedQuery) setSubmittedQuery(""); }}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setSubmittedQuery(""); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions */}
      {showSuggestions && (
        <View className="border-b border-border">
          {suggestions!.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => { setQuery(s); handleSubmit(); }}
              className="px-5 py-3 flex-row items-center gap-3"
            >
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <Text className="text-sm text-text-primary">{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Searches */}
      {!showResults && !showSuggestions && recentLoaded && recentSearches.length > 0 && (
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-text-primary">সাম্প্রতিক খোঁজ</Text>
            <TouchableOpacity onPress={handleClearRecent}>
              <Text className="text-xs text-text-muted">সব মুছুন</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => handleRecentPress(q)}
              className="flex-row items-center gap-3 py-2.5"
            >
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text className="text-sm text-text-secondary flex-1">{q}</Text>
              <TouchableOpacity onPress={() => setRecentSearches((prev) => prev.filter((r) => r !== q))}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state when no query */}
      {!showResults && !showSuggestions && recentLoaded && recentSearches.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
            <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text className="text-base font-semibold text-text-primary">বই খুঁজুন</Text>
          <Text className="text-sm text-text-secondary mt-1">শিরোনাম, লেখক বা বিষয় লিখুন</Text>
        </View>
      )}

      {/* Loading */}
      {showResults && resultsLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
          <Text className="text-sm text-text-muted mt-2">খোঁজা হচ্ছে...</Text>
        </View>
      )}

      {/* Results */}
      {showResults && !resultsLoading && (
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <BookCard book={item} variant="list" />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
                <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
              </View>
              <Text className="text-sm text-text-secondary">
                "{submittedQuery}" এর জন্য কোনো বই পাওয়া যায়নি
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
