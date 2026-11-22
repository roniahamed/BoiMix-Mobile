import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import {
  ordersApi,
  type Order,
  type BorrowOrder,
  type ExchangeOrder,
} from "@/lib/api/orders";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";
import { useAuthStore } from "@/stores/auth-store";

type TabType = "purchases" | "borrows" | "exchanges";

// ─── Status Badge Colors & Labels ─────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  // Purchases
  pending: { label: "অপেক্ষমান", bg: "#FEF3C7", text: "#D97706" },
  confirmed: { label: "নিশ্চিত", bg: "#DBEAFE", text: "#2563EB" },
  shipped: { label: "চলমান", bg: "#F3E8FF", text: "#9333EA" },
  delivered: { label: "বিতরণ সম্পন্ন", bg: "#D1FAE5", text: "#059669" },
  cancelled: { label: "বাতিল", bg: "#FEE2E2", text: "#DC2626" },
  // Borrows
  approved: { label: "অনুমোদিত", bg: "#DBEAFE", text: "#2563EB" },
  active: { label: "চলমান ধার", bg: "#D1FAE5", text: "#059669" },
  returned: { label: "ফেরত দেওয়া হয়েছে", bg: "#F3F4F6", text: "#6B7280" },
  overdue: { label: "মেয়াদোত্তীর্ণ", bg: "#FEE2E2", text: "#DC2626" },
  // Exchanges
  accepted: { label: "গৃহীত", bg: "#D1FAE5", text: "#059669" },
  rejected: { label: "প্রত্যাখ্যাত", bg: "#FEE2E2", text: "#DC2626" },
  completed: { label: "বিনিময় সম্পন্ন", bg: "#D1FAE5", text: "#059669" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: "#F3F4F6",
    text: "#4B5563",
  };
  return (
    <View style={{ backgroundColor: cfg.bg }} className="px-2 py-0.5 rounded-full">
      <Text style={{ color: cfg.text }} className="text-xs font-semibold">
        {cfg.label}
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabType>("purchases");
  const [refreshing, setRefreshing] = useState(false);

  // ── Queries ──
  const purchasesQuery = useQuery({
    queryKey: ["me", "orders"],
    queryFn: async () => {
      try {
        const res = await ordersApi.getOrders();
        return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
      } catch {
        return [] as Order[];
      }
    },
    enabled: !!user && activeTab === "purchases",
  });

  const borrowsQuery = useQuery({
    queryKey: ["me", "borrow-orders"],
    queryFn: async () => {
      try {
        const res = await ordersApi.getBorrowOrders();
        return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
      } catch {
        return [] as BorrowOrder[];
      }
    },
    enabled: !!user && activeTab === "borrows",
  });

  const exchangesQuery = useQuery({
    queryKey: ["me", "exchanges"],
    queryFn: async () => {
      try {
        const res = await ordersApi.getExchanges();
        return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
      } catch {
        return [] as ExchangeOrder[];
      }
    },
    enabled: !!user && activeTab === "exchanges",
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "purchases") await purchasesQuery.refetch();
    if (activeTab === "borrows") await borrowsQuery.refetch();
    if (activeTab === "exchanges") await exchangesQuery.refetch();
    setRefreshing(false);
  };

  const purchases = purchasesQuery.data ?? [];
  const borrows = borrowsQuery.data ?? [];
  const exchanges = exchangesQuery.data ?? [];

  const isLoading =
    (activeTab === "purchases" && purchasesQuery.isLoading) ||
    (activeTab === "borrows" && borrowsQuery.isLoading) ||
    (activeTab === "exchanges" && exchangesQuery.isLoading);

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-white px-4 pb-3 border-b border-border-light shadow-sm"
      >
        <Text className="text-lg font-bold text-text-primary mb-3">
          অর্ডার ও লেনদেন
        </Text>

        {/* Segmented Control */}
        <View className="flex-row bg-surface-dark p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab("purchases")}
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === "purchases" ? "bg-white shadow-sm" : ""
              }`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "purchases" ? "text-primary" : "text-text-secondary"
                }`}
            >
              কেনা বই
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("borrows")}
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === "borrows" ? "bg-white shadow-sm" : ""
              }`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "borrows" ? "text-primary" : "text-text-secondary"
                }`}
            >
              ধার নেওয়া
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("exchanges")}
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === "exchanges" ? "bg-white shadow-sm" : ""
              }`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "exchanges" ? "text-primary" : "text-text-secondary"
                }`}
            >
              বিনিময়
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {!user ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Ionicons name="receipt-outline" size={34} color={Colors.primary} />
          </View>
          <Text className="text-lg font-bold text-text-primary text-center">
            অর্ডার দেখতে সাইন ইন করুন
          </Text>
          <Text className="text-sm text-text-secondary text-center mt-1.5 mb-6 max-w-xs leading-5">
            আপনার সকল কেনা, ধার নেওয়া ও বিনিময় করা বইয়ের বিবরণ দেখতে আপনার অ্যাকাউন্টে লগইন করুন।
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            className="bg-primary px-8 py-3 rounded-xl shadow-sm"
          >
            <Text className="text-white font-bold text-sm">লগইন বা সাইন আপ করুন</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
          <Text className="text-xs text-text-muted mt-2">তথ্য লোড হচ্ছে...</Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* TAB 1: Purchases */}
          {activeTab === "purchases" && (
            <FlashList
              data={purchases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              renderItem={({ item }: { item: Order }) => (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/orders/[id]", params: { id: item.id } })}
                    activeOpacity={0.8}
                    className="bg-white rounded-2xl p-4 mb-3 border border-border-light shadow-sm"
                  >
                    <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-border-light">
                      <Text className="text-xs font-bold text-text-primary">
                        অর্ডার #{item.orderNumber || item.id.slice(0, 8)}
                      </Text>
                      <StatusBadge status={item.status} />
                    </View>

                    {item.items?.map((orderItem) => (
                      <View key={orderItem.id} className="flex-row items-center py-1.5">
                        <Image
                          source={{ uri: resolveMediaUrl(orderItem.book?.coverUrl) }}
                          style={{ width: 40, height: 56, borderRadius: 6 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                            {orderItem.book?.title}
                          </Text>
                          <Text className="text-xs text-text-muted mt-0.5">
                            {orderItem.quantity}টি × ৳{orderItem.price}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-border-light">
                      <Text className="text-xs text-text-muted">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString("bn-BD")}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-bold text-primary">
                          মোট: ৳{item.totalAmount}
                        </Text>
                        <View className="flex-row items-center bg-primary/10 px-2 py-0.5 rounded-md">
                          <Text className="text-[11px] font-bold text-primary mr-0.5">ট্র্যাকিং</Text>
                          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                        </View>
                      </View>
                    </View>
                </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View className="items-center py-24">
          <View className="w-16 h-16 rounded-full bg-surface-card border border-border items-center justify-center mb-3">
            <Ionicons name="bag-handle-outline" size={30} color={Colors.textMuted} />
          </View>
          <Text className="text-base font-bold text-text-primary">কোনো কেনা বই নেই</Text>
          <Text className="text-xs text-text-secondary mt-1">
            বই কিনে অর্ডার করলে এখানে তার বিবরণ দেখতে পাবেন
          </Text>
        </View>
      }
            />
          )}

      {/* TAB 2: Borrows */}
      {activeTab === "borrows" && (
        <FlashList
          data={borrows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }: { item: BorrowOrder }) => (
            <TouchableOpacity
              onPress={() => {
                const target = item.book?.slug || item.book?.id;
                if (target) router.push(`/book/${target}` as never);
              }}
              activeOpacity={0.8}
              className="bg-white rounded-2xl p-4 mb-3 border border-border-light shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-border-light">
                <Text className="text-xs font-bold text-text-primary">
                  মেয়াদ: {item.duration || "২ সপ্তাহ"}
                </Text>
                <StatusBadge status={item.status} />
              </View>

              <View className="flex-row items-center py-1.5">
                <Image
                  source={{ uri: resolveMediaUrl(item.book?.coverUrl) }}
                  style={{ width: 40, height: 56, borderRadius: 6 }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                    {item.book?.title}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    জামানত: ৳{item.depositAmount} (ফেরতযোগ্য)
                  </Text>
                </View>
              </View>

              {item.status === "overdue" && item.overdueDays && (
                <View className="bg-red-50 p-2 rounded-lg mt-2">
                  <Text className="text-xs font-bold text-error">
                    {item.overdueDays} দিন অতিক্রান্ত! বিলম্ব জরিমানা: ৳{item.fineAmount || 0}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-border-light">
                <Text className="text-xs text-text-muted">
                  ফেরতের তারিখ: {item.dueDate || "শীঘ্রই"}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-borrow">ধার</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.borrow} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-24">
              <View className="w-16 h-16 rounded-full bg-surface-card border border-border items-center justify-center mb-3">
                <Ionicons name="book-outline" size={30} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary">কোনো ধার করা বই নেই</Text>
              <Text className="text-xs text-text-secondary mt-1">
                লাইব্রেরি বা বন্ধুদের থেকে ধার নিলে এখানে দেখতে পাবেন
              </Text>
            </View>
          }
        />
      )}

      {/* TAB 3: Exchanges */}
      {activeTab === "exchanges" && (
        <FlashList
          data={exchanges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }: { item: ExchangeOrder }) => (
            <TouchableOpacity
              onPress={() => {
                router.push({ pathname: "/exchange/[id]", params: { id: item.id } });
              }}
              activeOpacity={0.8}
              className="bg-white rounded-2xl p-4 mb-3 border border-border-light shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-border-light">
                <Text className="text-xs font-bold text-text-primary">
                  বিনিময়ের প্রস্তাব
                </Text>
                <StatusBadge status={item.status} />
              </View>

              <View className="flex-row items-center justify-between py-2">
                {/* Requested Book */}
                <View className="flex-1 items-center">
                  <Image
                    source={{ uri: resolveMediaUrl(item.requestedBook?.coverUrl) }}
                    style={{ width: 44, height: 60, borderRadius: 6 }}
                    contentFit="cover"
                  />
                  <Text className="text-xs font-bold text-text-primary mt-1 text-center" numberOfLines={1}>
                    {item.requestedBook?.title}
                  </Text>
                  <Text className="text-xs text-text-muted">কাঙ্ক্ষিত বই</Text>
                </View>

                <View className="px-2">
                  <Ionicons name="repeat" size={20} color={Colors.exchange} />
                </View>

                {/* Offered Book */}
                <View className="flex-1 items-center">
                  <Image
                    source={{ uri: resolveMediaUrl(item.offeredBook?.coverUrl) }}
                    style={{ width: 44, height: 60, borderRadius: 6 }}
                    contentFit="cover"
                  />
                  <Text className="text-xs font-bold text-text-primary mt-1 text-center" numberOfLines={1}>
                    {item.offeredBook?.title}
                  </Text>
                  <Text className="text-xs text-text-muted">আপনার প্রস্তাবিত</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-border-light">
                <Text className="text-xs text-text-muted">
                  {new Date(item.createdAt || Date.now()).toLocaleDateString("bn-BD")}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-exchange">বিনিময় বিবরণ</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.exchange} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-24">
              <View className="w-16 h-16 rounded-full bg-surface-card border border-border items-center justify-center mb-3">
                <Ionicons name="repeat-outline" size={30} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary">কোনো বিনিময় রেকর্ড নেই</Text>
              <Text className="text-xs text-text-secondary mt-1">
                বই অদলবদল বা বিনিময়ের অনুরোধ পাঠালে এখানে আসবে
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}
    </View >
  );
}
