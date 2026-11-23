import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { usersApi } from "@/lib/api/users";
import { ordersApi } from "@/lib/api/orders";
import { resolveMediaUrl } from "@/lib/utils/media";
import type { BookCardBook } from "@/types/book";

export default function ExchangeProposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    book_id: string;
    title: string;
    author: string;
    image?: string;
    owner_name?: string;
  }>();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [deliveryPreference, setDeliveryPreference] = useState<"handover" | "courier">("handover");

  // Fetch my listed books
  const { data: myBooksData, isLoading: isLoadingBooks } = useQuery({
    queryKey: ["my-library-for-exchange"],
    queryFn: async () => {
      try {
        const res = await usersApi.getMyLibrary();
        return res.data?.results || [];
      } catch {
        return [];
      }
    },
  });

  const myBooks = myBooksData ?? [];

  const proposeMutation = useMutation({
    mutationFn: async () => {
      if (!params.book_id || !selectedBookId) {
        throw new Error("অনুগ্রহ করে আপনার একটি বই নির্বাচন করুন");
      }
      return ordersApi.createExchange({
        requested_book_id: params.book_id,
        offered_book_id: selectedBookId,
        note: `${note ? note + " | " : ""}হস্তান্তর মাধ্যম: ${deliveryPreference === "handover" ? "সরাসরি সাক্ষাৎ" : "কুরিয়ার"}`,
      });
    },
    onSuccess: () => {
      if (Platform.OS === "web") {
        alert("বিনিময়ের প্রস্তাবটি সফলভাবে পাঠানো হয়েছে! বইয়ের মালিক এটি গ্রহণ করলে আপনাকে অবহিত করা হবে।");
        router.replace("/tabs/orders");
      } else {
        Alert.alert(
          "সফল প্রস্তাবনা",
          "বিনিময়ের প্রস্তাবটি সফলভাবে পাঠানো হয়েছে! বইয়ের মালিক এটি গ্রহণ করলে আপনাকে অবহিত করা হবে।",
          [
            {
              text: "অর্ডার ও বিনিময় দেখুন",
              onPress: () => router.replace("/tabs/orders"),
            },
          ]
        );
      }
    },
    onError: (err: any) => {
      Alert.alert(
        "ত্রুটি",
        err?.response?.data?.message || err?.message || "প্রস্তাব পাঠাতে ব্যর্থ হয়েছে।"
      );
    },
  });

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">
          বিনিময় প্রস্তাব তৈরি করুন
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Requested Book Banner */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          আপনি যে বইটি চাইছেন
        </Text>
        <View className="flex-row bg-white rounded-2xl p-4 border border-border mb-6">
          <Image
            source={{ uri: resolveMediaUrl(params.image) }}
            style={{ width: 68, height: 96, borderRadius: 8 }}
            contentFit="cover"
          />
          <View className="flex-1 ml-3.5 justify-center">
            <Text className="text-base font-bold text-text-primary" numberOfLines={2}>
              {params.title || "নির্বাচিত বই"}
            </Text>
            <Text className="text-xs text-text-secondary mt-1">
              লেখক: {params.author || "অজানা"}
            </Text>
            {Boolean(params.owner_name) && (
              <View className="flex-row items-center mt-2 bg-emerald-50 px-2.5 py-1 rounded-full self-start">
                <Ionicons name="person-outline" size={12} color={Colors.primary} />
                <Text className="text-xs text-primary font-medium ml-1">
                  মালিক: {params.owner_name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow Divider */}
        <View className="items-center my-1 mb-4">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
          </View>
        </View>

        {/* My Books to Offer Selection */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            বিনিময়ে আপনার বই নির্বাচন করুন
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/upload")}
            className="flex-row items-center"
          >
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text className="text-xs text-primary font-semibold ml-1">নতুন বই যুক্ত করুন</Text>
          </TouchableOpacity>
        </View>

        {isLoadingBooks ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center border border-border mb-6">
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text className="text-xs text-text-muted mt-2">আপনার বই তালিকা লোড হচ্ছে...</Text>
          </View>
        ) : myBooks.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center text-center border border-dashed border-border mb-6">
            <Ionicons name="book-outline" size={36} color={Colors.textMuted} />
            <Text className="text-sm font-bold text-text-primary mt-2">
              আপনার কোনো সক্রিয় বই তালিকাভুক্ত নেই
            </Text>
            <Text className="text-xs text-text-muted mt-1 text-center">
              বিনিময় করতে হলে আপনার নিজের সংগ্রহ থেকে অন্তত একটি বই তালিকাভুক্ত থাকতে হবে।
            </Text>
            <View className="mt-4">
              <Button
                label="এখনই বই আপলোড করুন"
                variant="outline"
                size="sm"
                onPress={() => router.push("/upload")}
              />
            </View>
          </View>
        ) : (
          <View className="gap-2.5 mb-6">
            {myBooks.map((book: BookCardBook) => {
              const isSelected = selectedBookId === book.id;
              return (
                <TouchableOpacity
                  key={book.id}
                  onPress={() => setSelectedBookId(book.id)}
                  className={`flex-row items-center p-3 rounded-2xl border bg-white ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {Boolean(
                    resolveMediaUrl(
                      book.coverUrl ||
                        (book as any).cover_image_url ||
                        (book as any).cover_image ||
                        (book as any).coverImage
                    )
                  ) ? (
                    <Image
                      source={{
                        uri: resolveMediaUrl(
                          book.coverUrl ||
                            (book as any).cover_image_url ||
                            (book as any).cover_image ||
                            (book as any).coverImage
                        ),
                      }}
                      style={{ width: 48, height: 64, borderRadius: 6 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{ width: 48, height: 64, borderRadius: 6 }}
                      className="bg-slate-100 items-center justify-center border border-slate-200"
                    >
                      <Ionicons name="book-outline" size={20} color={Colors.textMuted} />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-0.5">
                      {book.author}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-text-muted">
                        অবস্থা: {book.condition || "ভালো"}
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center ml-2 ${
                      isSelected ? "border-primary bg-primary" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Handover Preference */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          হস্তান্তর মাধ্যম পছন্দ করুন
        </Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => setDeliveryPreference("handover")}
            className={`flex-1 p-3.5 rounded-xl border bg-white flex-row items-center ${
              deliveryPreference === "handover" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={deliveryPreference === "handover" ? Colors.primary : Colors.textMuted}
            />
            <View className="ml-2.5">
              <Text className="text-xs font-bold text-text-primary">সরাসরি সাক্ষাৎ</Text>
              <Text className="text-[10px] text-text-muted">নিজেদের সুবিধাজনক স্থানে</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDeliveryPreference("courier")}
            className={`flex-1 p-3.5 rounded-xl border bg-white flex-row items-center ${
              deliveryPreference === "courier" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Ionicons
              name="bicycle-outline"
              size={20}
              color={deliveryPreference === "courier" ? Colors.primary : Colors.textMuted}
            />
            <View className="ml-2.5">
              <Text className="text-xs font-bold text-text-primary">কুরিয়ার সার্ভিস</Text>
              <Text className="text-[10px] text-text-muted">হোম ডেলিভারি বা পার্সেল</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Note / Message to Book Owner */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          বইয়ের মালিককে বার্তা দিন (ঐচ্ছিক)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="যেমন: আমি বইটি ৩ দিনের মধ্যে অদল-বদল করতে পারি..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-white border border-border rounded-2xl p-3.5 text-sm text-text-primary min-h-[90px] mb-6"
        />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-3 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          label={proposeMutation.isPending ? "প্রস্তাব পাঠানো হচ্ছে..." : "বিনিময়ের প্রস্তাব পাঠান"}
          disabled={!selectedBookId || proposeMutation.isPending}
          loading={proposeMutation.isPending}
          onPress={() => proposeMutation.mutate()}
        />
      </View>
    </View>
  );
}
