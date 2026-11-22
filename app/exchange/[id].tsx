import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { ordersApi, type ExchangeOrder } from "@/lib/api/orders";
import { resolveMediaUrl } from "@/lib/utils/media";

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: "অপেক্ষমান", bg: "#FEF3C7", text: "#D97706", icon: "time-outline" },
  accepted: { label: "গৃহীত হয়েছে", bg: "#D1FAE5", text: "#059669", icon: "checkmark-circle-outline" },
  rejected: { label: "বাতিল হয়েছে", bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" },
  completed: { label: "সম্পন্ন", bg: "#DBEAFE", text: "#2563EB", icon: "shield-checkmark-outline" },
};

export default function ExchangeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch exchange details
  const { data: exchange, isLoading, refetch } = useQuery<ExchangeOrder | null>({
    queryKey: ["exchange-detail", id],
    queryFn: async () => {
      try {
        const res = await ordersApi.getExchanges();
        const found = res.data?.results?.find((e: ExchangeOrder) => e.id === id);
        if (found) return found;
      } catch {
        return null;
      }
      return null;
    },
  });

  const [actionLoading, setActionLoading] = useState(false);

  const handleRespond = async (action: "accept" | "reject") => {
    if (!id) return;
    setActionLoading(true);
    try {
      await ordersApi.respondExchange(id, action);
      Alert.alert(
        action === "accept" ? "প্রস্তাব গৃহীত হয়েছে" : "প্রস্তাব বাতিল হয়েছে",
        action === "accept"
          ? "অভিনন্দন! আপনারা এখন একে অপরের সাথে বই আদান-প্রদান করতে পারবেন।"
          : "বিনিময়ের প্রস্তাবটি সফলভাবে প্রত্যাখ্যান করা হয়েছে।"
      );
      refetch();
    } catch {
      Alert.alert("ত্রুটি", "অনুরোধটি সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-xs text-text-muted mt-2">বিনিময় বিবরণ লোড হচ্ছে...</Text>
      </View>
    );
  }

  if (!exchange) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6" style={{ paddingTop: insets.top }}>
        <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
          <Ionicons name="swap-horizontal-outline" size={32} color={Colors.textMuted} />
        </View>
        <Text className="text-base font-bold text-text-primary">বিনিময়ের বিবরণ পাওয়া যায়নি</Text>
        <Text className="text-xs text-text-muted text-center mt-1 mb-6">
          এই প্রস্তাবটি ইতিমধ্যে সমাপ্ত হয়েছে অথবা আর বিদ্যমান নেই।
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-2.5 rounded-xl"
        >
          <Text className="text-white font-bold text-xs">ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_MAP[exchange.status] || STATUS_MAP.pending;

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: insets.top }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">
          বিনিময়ের বিস্তারিত
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Chip Header */}
        <View className="bg-white rounded-2xl p-4 border border-border flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xs text-text-muted">বিনিময় আইডি: #{exchange.id.slice(-6)}</Text>
            <Text className="text-sm font-semibold text-text-primary mt-0.5">
              বিনিময়কারী: {exchange.otherUserName || "বইপ্রেমী পাঠক"}
            </Text>
          </View>
          <View
            style={{ backgroundColor: statusConfig.bg }}
            className="flex-row items-center px-3 py-1.5 rounded-full"
          >
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.text} />
            <Text style={{ color: statusConfig.text }} className="text-xs font-bold ml-1">
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Books Comparison Side-by-side / Stacked */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          বই বিনিময়ের তুলনামূলক বিবরণ
        </Text>

        {/* Requested Book */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-2">
              <Ionicons name="arrow-down-outline" size={14} color="#2563EB" />
            </View>
            <Text className="text-xs font-bold text-blue-700 uppercase">কাঙ্ক্ষিত বই (Requested)</Text>
          </View>
          <View className="flex-row">
            <Image
              source={{ uri: resolveMediaUrl(exchange.requestedBook.coverUrl || (exchange.requestedBook as any).coverImage) }}
              style={{ width: 60, height: 84, borderRadius: 6 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3 justify-center">
              <Text className="text-sm font-bold text-text-primary" numberOfLines={2}>
                {exchange.requestedBook.title}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                {exchange.requestedBook.author}
              </Text>
              <Text className="text-xs text-text-muted mt-1">
                মালিক: {exchange.otherUserName || "অন্য ব্যবহারকারী"}
              </Text>
            </View>
          </View>
        </View>

        {/* Swap Icon */}
        <View className="items-center my-0.5 mb-3">
          <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="swap-vertical" size={18} color={Colors.primary} />
          </View>
        </View>

        {/* Offered Book */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-6">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center mr-2">
              <Ionicons name="arrow-up-outline" size={14} color="#059669" />
            </View>
            <Text className="text-xs font-bold text-emerald-700 uppercase">প্রস্তাবিত বই (Offered)</Text>
          </View>
          <View className="flex-row">
            <Image
              source={{ uri: resolveMediaUrl(exchange.offeredBook.coverUrl || (exchange.offeredBook as any).coverImage) }}
              style={{ width: 60, height: 84, borderRadius: 6 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3 justify-center">
              <Text className="text-sm font-bold text-text-primary" numberOfLines={2}>
                {exchange.offeredBook.title}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                {exchange.offeredBook.author}
              </Text>
              <Text className="text-xs text-text-muted mt-1">
                অবস্থা: {exchange.offeredBook.condition || "ভালো"}
              </Text>
            </View>
          </View>
        </View>

        {/* Guidelines / Safety Note */}
        <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text className="text-xs font-bold text-text-primary ml-1.5">
              নিরাপদ বই বিনিময়ের নিয়মাবলী
            </Text>
          </View>
          <Text className="text-xs text-text-secondary leading-5">
            - বই বিনিময়ের জন্য জনবহুল ও নিরাপদ স্থান নির্বাচন করুন।{"\n"}
            - হস্তান্তরের পূর্বে বইটির অবস্থা ভালোভাবে যাচাই করে নিন।{"\n"}
            - কোনো সমস্যা দেখা দিলে অবিলম্বে BoiMix সাপোর্ট টিমের সাথে যোগাযোগ করুন।
          </Text>
        </View>
      </ScrollView>

      {/* Action Footer */}
      {exchange.status === "pending" && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex-row gap-3 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1">
            <Button
              label="প্রত্যাখ্যান করুন"
              variant="danger"
              disabled={actionLoading}
              onPress={() => handleRespond("reject")}
            />
          </View>
          <View className="flex-1">
            <Button
              label="প্রস্তাব গ্রহণ করুন"
              variant="primary"
              loading={actionLoading}
              disabled={actionLoading}
              onPress={() => handleRespond("accept")}
            />
          </View>
        </View>
      )}
    </View>
  );
}
