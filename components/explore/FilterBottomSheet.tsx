import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { booksApi } from "@/lib/api/books";
import { useFilterStore } from "@/stores/filter-store";
import type { BookCondition, BookAvailabilityMode } from "@/types/book";

type Props = { visible: boolean; onClose: () => void; onApply: () => void };
type Facet = "categories" | "locations" | "authors" | "publishers" | "languages";
type Draft = { mode: BookAvailabilityMode | null; categories: string[]; conditions: BookCondition[]; location: string; author: string; publisher: string; language: string };

const MODES: { value: BookAvailabilityMode; label: string }[] = [{ value: "sell", label: "বিক্রয়" }, { value: "exchange", label: "বিনিময়" }, { value: "borrow", label: "ধার" }];
const CONDITIONS: { value: BookCondition; label: string }[] = [{ value: "new", label: "New" }, { value: "excellent", label: "Like New" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" }];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} className={`px-3 py-2 rounded-full border mr-2 mb-2 ${selected ? "bg-primary border-primary" : "bg-white border-border"}`}><Text className={`text-xs font-semibold ${selected ? "text-white" : "text-text-primary"}`}>{label}</Text></TouchableOpacity>;
}

function FacetOptions({ facet, value, onChange }: { facet: Facet; value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["book-filter-facet", facet, search],
    queryFn: ({ pageParam }) => booksApi.getFilterFacet(facet, { search: search.trim() || undefined, page: pageParam, page_size: 30 }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => last.data.next ? pages.length + 1 : undefined,
    staleTime: 60_000,
  });
  const options = data?.pages.flatMap((page) => page.data.results) ?? [];
  return <View className="pt-2 pb-3">
    <View className="flex-row items-center bg-surface-dark rounded-xl px-3 mb-3"><Ionicons name="search-outline" size={17} color={Colors.textMuted} /><TextInput value={search} onChangeText={setSearch} placeholder="খুঁজুন..." placeholderTextColor={Colors.textMuted} className="flex-1 px-2 py-2.5 text-sm text-text-primary" autoCorrect={false} /></View>
    {isLoading ? <ActivityIndicator color={Colors.primary} /> : isError ? <TouchableOpacity onPress={() => refetch()}><Text className="text-primary text-sm">লোড হয়নি · আবার চেষ্টা করুন</Text></TouchableOpacity> : options.length === 0 ? <Text className="text-xs text-text-secondary">কোনো অপশন পাওয়া যায়নি</Text> : <View className="flex-row flex-wrap">{options.map((option) => <Chip key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(value === option.value ? "" : option.value)} />)}</View>}
    {hasNextPage && <TouchableOpacity disabled={isFetchingNextPage} onPress={() => fetchNextPage()} className="self-start py-2"><Text className="text-primary text-xs font-bold">{isFetchingNextPage ? "লোড হচ্ছে..." : "আরও দেখুন"}</Text></TouchableOpacity>}
  </View>;
}

function FilterContents({ onClose, onApply }: Omit<Props, "visible">) {
  const insets = useSafeAreaInsets();
  const store = useFilterStore();
  const [draft, setDraft] = useState<Draft>(() => ({ mode: store.mode, categories: store.categories, conditions: store.conditions, location: store.location, author: store.author, publisher: store.publisher, language: store.language }));
  const [open, setOpen] = useState<Facet | null>(null);
  const fields: { key: Facet; label: string; field: "location" | "author" | "publisher" | "language" | "categories" }[] = [
    { key: "categories", label: "Category", field: "categories" },
    { key: "locations", label: "Location / Area", field: "location" },
    { key: "authors", label: "Author", field: "author" },
    { key: "publishers", label: "Publisher", field: "publisher" },
    { key: "languages", label: "Language", field: "language" },
  ];
  const reset = () => setDraft({ mode: null, categories: [], conditions: [], location: "", author: "", publisher: "", language: "" });
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="justify-end flex-1" pointerEvents="box-none">
    <Pressable onPress={onClose} className="flex-1" />
    <View className="bg-white rounded-t-3xl" style={{ maxHeight: "85%", paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="items-center pt-3"><View className="w-10 h-1 bg-border rounded-full" /></View>
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border-light"><Text className="text-lg font-bold text-secondary">ফিল্টার</Text><TouchableOpacity onPress={reset}><Text className="text-sm text-primary font-semibold">রিসেট করুন</Text></TouchableOpacity></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-sm font-bold text-text-primary mb-2">Book Type</Text>
        <View className="flex-row flex-wrap mb-3"><Chip label="সব" selected={!draft.mode} onPress={() => setDraft({ ...draft, mode: null })} />{MODES.map((item) => <Chip key={item.value} label={item.label} selected={draft.mode === item.value} onPress={() => setDraft({ ...draft, mode: draft.mode === item.value ? null : item.value })} />)}</View>
        {fields.map(({ key, label, field }) => {
          const current = field === "categories" ? draft.categories[0] || "" : draft[field];
          return <View key={key} className="border-b border-border-light"><TouchableOpacity onPress={() => setOpen(open === key ? null : key)} className="flex-row items-center py-3" accessibilityRole="button" accessibilityState={{ expanded: open === key }}><View className="flex-1"><Text className="text-sm font-bold text-text-primary">{label}</Text>{!!current && <Text className="text-xs text-primary mt-1" numberOfLines={1}>{current}</Text>}</View><Ionicons name={open === key ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} /></TouchableOpacity>{open === key && <FacetOptions key={key} facet={key} value={current} onChange={(value) => setDraft(field === "categories" ? { ...draft, categories: value ? [value] : [] } : { ...draft, [field]: value })} />}</View>;
        })}
        <Text className="text-sm font-bold text-text-primary mt-4 mb-2">Condition</Text>
        <View className="flex-row flex-wrap">{CONDITIONS.map((item) => <Chip key={item.value} label={item.label} selected={draft.conditions.includes(item.value)} onPress={() => setDraft({ ...draft, conditions: draft.conditions.includes(item.value) ? draft.conditions.filter((condition) => condition !== item.value) : [...draft.conditions, item.value] })} />)}</View>
      </ScrollView>
      <View className="px-5 pt-3 border-t border-border-light"><TouchableOpacity onPress={() => { store.applyDetails(draft); onApply(); onClose(); }} className="bg-primary rounded-full py-3 items-center" accessibilityRole="button"><Text className="text-white font-bold">ফলাফল দেখুন</Text></TouchableOpacity></View>
    </View>
  </KeyboardAvoidingView>;
}

export function FilterBottomSheet({ visible, onClose, onApply }: Props) {
  return <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}><View className="flex-1 bg-black/40">{visible && <FilterContents onClose={onClose} onApply={onApply} />}</View></Modal>;
}
