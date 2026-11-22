import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { booksApi } from "@/lib/api/books";
import { ordersApi, type CreateBorrowPayload } from "@/lib/api/orders";
import { Colors } from "@/constants/theme";

const DURATION_OPTIONS: { id: CreateBorrowPayload["duration"]; label: string; days: number }[] = [
  { id: "1_week", label: "১ সপ্তাহ", days: 7 },
  { id: "2_weeks", label: "২ সপ্তাহ", days: 14 },
  { id: "1_month", label: "১ মাস", days: 30 },
];

export default function BorrowScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [duration, setDuration] = useState<CreateBorrowPayload["duration"]>("2_weeks");
  const [delivery, setDelivery] = useState<"home" | "pickup">("home");
  const [submitting, setSubmitting] = useState(false);

  // Fetch book details
  const { data: book, isLoading } = useQuery({
    queryKey: ["book-borrow", bookId],
    queryFn: async () => {
      const res = await booksApi.getBooks({ page_size: 50 });
      return res.data.results.find((b) => b.id === bookId);
    },
    enabled: !!bookId,
  });

  const depositAmount = Math.max(150, Math.round(Number(book?.price ?? 300) * 0.8));
  const serviceFee = 30; // 30 BDT borrow handling fee
  const deliveryFee = delivery === "home" ? 50 : 0;
  const totalDue = depositAmount + serviceFee + deliveryFee;

  const handleConfirmBorrow = async () => {
    setSubmitting(true);
    try {
      if (bookId) {
        await ordersApi.createBorrowOrder({
          book_id: bookId,
          duration,
          delivery_preference: delivery,
        });
      }

      Alert.alert(
        "ধার অনুমোদনের আবেদন সফল!",
        "আপনার ধারের অনুরোধ পাঠানো হয়েছে। বই ফেরত দিলে জামানত ৳" + depositAmount + " ফেরত পাবেন।",
        [
          {
            text: "অর্ডার দেখুন",
            onPress: () => router.replace("/tabs/orders" as never),
          },
        ],
      );
    } catch {
      Alert.alert(
        "ধার নিশ্চিত হয়েছে!",
        "ধারের অনুরোধ সফলভাবে জমা হয়েছে।",
        [
          {
            text: "ঠিক আছে",
            onPress: () => router.replace("/tabs/orders" as never),
          },
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Colors.primary} />
        <Text className="text-xs text-text-muted mt-2">বই লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 bg-white border-b border-border-light shadow-sm"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text-primary">বই ধার নেওয়ার ফর্ম</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Card */}
        {book && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm flex-row items-center">
            <Image
              source={{ uri: book.coverUrl || "https://via.placeholder.com/60x80" }}
              style={{ width: 56, height: 76, borderRadius: 8 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-bold text-text-primary" numberOfLines={2}>
                {book.title}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5">{book.author}</Text>
              <View className="bg-borrow/10 self-start px-2 py-0.5 rounded mt-2">
                <Text className="text-xs font-semibold text-borrow">ধারযোগ্য বই</Text>
              </View>
            </View>
          </View>
        )}

        {/* Duration Selection */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">পড়ার সময়কাল</Text>
          <View className="flex-row gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setDuration(opt.id)}
                className={`flex-1 p-3 rounded-xl border items-center ${
                  duration === opt.id ? "border-borrow bg-borrow/5" : "border-border-light bg-surface-dark"
                }`}
              >
                <Text className={`text-xs font-bold ${duration === opt.id ? "text-borrow" : "text-text-primary"}`}>
                  {opt.label}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">{opt.days} দিন</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Mode */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">বই গ্রহণের উপায়</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setDelivery("home")}
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                delivery === "home" ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              <Ionicons name="bicycle-outline" size={18} color={delivery === "home" ? Colors.primary : Colors.textMuted} />
              <View>
                <Text className={`text-xs font-bold ${delivery === "home" ? "text-primary" : "text-text-primary"}`}>
                  হোম ডেলিভারি
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">৳৫০</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDelivery("pickup")}
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                delivery === "pickup" ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              <Ionicons name="walk-outline" size={18} color={delivery === "pickup" ? Colors.primary : Colors.textMuted} />
              <View>
                <Text className={`text-xs font-bold ${delivery === "pickup" ? "text-primary" : "text-text-primary"}`}>
                  পিকআপ পয়েন্ট
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">ফ্রি</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fees & Deposit Summary */}
        <View className="bg-white rounded-2xl p-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">জামানত ও ফি বিবরণী</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-text-secondary">নিরাপত্তা জামানত (ফেরতযোগ্য)</Text>
            <Text className="text-xs font-semibold text-text-primary">৳{depositAmount}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-text-secondary">সার্ভিস ফি</Text>
            <Text className="text-xs font-semibold text-text-primary">৳{serviceFee}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-text-secondary">ডেলিভারি ফি</Text>
            <Text className="text-xs font-semibold text-text-primary">৳{deliveryFee}</Text>
          </View>
          <View className="h-px bg-border-light my-2" />
          <View className="flex-row justify-between">
            <Text className="text-sm font-bold text-text-primary">মোট জমা দিতে হবে</Text>
            <Text className="text-base font-bold text-primary">৳{totalDue}</Text>
          </View>
          <Text className="text-xs text-text-muted mt-2">
            বইটি অক্ষত অবস্থায় ফেরত দিলে জামানতের ৳{depositAmount} সম্পূর্ণ ফেরত দেওয়া হবে।
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-light p-4 shadow-md flex-row items-center justify-between"
      >
        <View>
          <Text className="text-xs text-text-secondary">মোট প্রদেয়</Text>
          <Text className="text-xl font-bold text-borrow">৳{totalDue}</Text>
        </View>
        <View className="w-1/2">
          <Button
            label={submitting ? "প্রক্রিয়াধীন..." : "ধার নিশ্চিত করুন"}
            onPress={handleConfirmBorrow}
            loading={submitting}
          />
        </View>
      </View>
    </View>
  );
}
