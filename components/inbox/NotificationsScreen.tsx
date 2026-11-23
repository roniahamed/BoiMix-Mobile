import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth-store";
import type { Notification } from "@/types/notification";

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  order: { icon: "bag-check-outline", color: "#2563EB", bg: "#EFF6FF" },
  borrow_request: { icon: "time-outline", color: "#D97706", bg: "#FEF3C7" },
  borrow_approved: { icon: "checkmark-circle-outline", color: "#059669", bg: "#ECFDF5" },
  borrow_returned: { icon: "return-down-back-outline", color: "#059669", bg: "#ECFDF5" },
  exchange_offer: { icon: "swap-horizontal-outline", color: "#7C3AED", bg: "#F5F3FF" },
  exchange_accepted: { icon: "swap-horizontal", color: "#059669", bg: "#ECFDF5" },
  review: { icon: "star-outline", color: "#EAB308", bg: "#FEFCE8" },
  message: { icon: "chatbubble-outline", color: "#0284C7", bg: "#F0F9FF" },
  system: { icon: "information-circle-outline", color: "#475569", bg: "#F1F5F9" },
};

export default function NotificationsScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<"all" | "transactions" | "system">("all");
  const [now] = useState(() => Date.now());

  const { data: notificationsData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications-list", user?.id],
    queryFn: async () => {
      const res = await notificationsApi.getNotifications();
      return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
    },
    enabled: !!user,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead();
    },
    onError: () => Alert.alert("সমস্যা হয়েছে", "নোটিফিকেশন পঠিত করা যায়নি। আবার চেষ্টা করুন।"),
    onSuccess: () => {
      queryClient.setQueryData(["notifications-list", user?.id], (old: Notification[] | undefined) =>
        (old ?? []).map((n) => ({ ...n, isRead: true, is_read: true }))
      );
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-notifications"] });
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id);
    },
    onError: () => Alert.alert("সমস্যা হয়েছে", "নোটিফিকেশন পঠিত করা যায়নি। আবার চেষ্টা করুন।"),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["notifications-list", user?.id], (old: Notification[] | undefined) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, isRead: true, is_read: true } : n))
      );
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-notifications"] });
    },
  });

  const list = (notificationsData ?? []).filter((item) => {
    if (filter === "all") return true;
    if (filter === "transactions") {
      return ["order", "borrow_request", "borrow_approved", "borrow_returned", "exchange_offer", "exchange_accepted"].includes(item.type);
    }
    if (filter === "system") {
      return ["system", "message", "review"].includes(item.type);
    }
    return true;
  });

  const handlePressItem = (item: Notification) => {
    if (!item.isRead && !item.is_read) {
      markSingleMutation.mutate(item.id);
    }
    const target = item.actionUrl || item.action_url || item.target_url;
    if (target?.startsWith("/")) router.push(target as any);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const diffMin = Math.floor((now - new Date(isoString).getTime()) / (1000 * 60));
    if (diffMin < 60) return `${Math.max(1, diffMin)} মিনিট আগে`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} দিন আগে`;
  };

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: embedded ? 0 : insets.top }}>
      {/* Header */}
      {!embedded && <View className="flex-row items-center justify-between px-4 py-3.5 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">বিজ্ঞপ্তি</Text>
        <TouchableOpacity
          onPress={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
          className="px-2 py-1"
        >
          <Text className="text-xs font-semibold text-primary">সব পঠিত</Text>
        </TouchableOpacity>
      </View>}
      {embedded && <TouchableOpacity onPress={() => markAllMutation.mutate()} disabled={!user || markAllMutation.isPending} className="bg-white px-4 py-2 items-end"><Text className="text-xs font-semibold text-primary">সব পঠিত</Text></TouchableOpacity>}
      {/* Filter Tabs */}
      <View className="flex-row bg-white px-4 py-2.5 border-b border-border gap-2">
        <TouchableOpacity
          onPress={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full border ${
            filter === "all" ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
          }`}
        >
          <Text className={`text-xs font-semibold ${filter === "all" ? "text-white" : "text-text-secondary"}`}>
            সকল
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter("transactions")}
          className={`px-4 py-1.5 rounded-full border ${
            filter === "transactions" ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
          }`}
        >
          <Text className={`text-xs font-semibold ${filter === "transactions" ? "text-white" : "text-text-secondary"}`}>
            লেনদেন ও বিনিময়
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter("system")}
          className={`px-4 py-1.5 rounded-full border ${
            filter === "system" ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
          }`}
        >
          <Text className={`text-xs font-semibold ${filter === "system" ? "text-white" : "text-text-secondary"}`}>
            সিস্টেম
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {!user ? (
        <View className="flex-1 items-center justify-center px-6"><Text className="text-base font-bold text-text-primary">নোটিফিকেশন দেখতে সাইন ইন করুন</Text><TouchableOpacity onPress={() => router.push("/auth/login")} className="bg-primary rounded-full px-6 py-3 mt-4"><Text className="text-white font-bold">সাইন ইন করুন</Text></TouchableOpacity></View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-xs text-text-muted mt-2">বিজ্ঞপ্তি লোড হচ্ছে...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6"><Text className="text-text-secondary mb-3">নোটিফিকেশন লোড করা যায়নি</Text><TouchableOpacity onPress={() => refetch()}><Text className="text-primary font-bold">আবার চেষ্টা করুন</Text></TouchableOpacity></View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                <Ionicons name="notifications-off-outline" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary">
                কোনো বিজ্ঞপ্তি নেই
              </Text>
              <Text className="text-xs text-text-muted text-center mt-1 px-8">
                আপনার বই সংক্রান্ত সকল আপডেট এবং বার্তা এখানে প্রদর্শিত হবে।
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = !item.isRead && !item.is_read;
            const typeConfig = TYPE_ICONS[item.type] || TYPE_ICONS.system;

            return (
              <TouchableOpacity
                onPress={() => handlePressItem(item)}
                className={`flex-row p-4 rounded-2xl mb-2.5 border ${
                  isUnread
                    ? "bg-emerald-50/50 border-primary/30"
                    : "bg-white border-border"
                }`}
              >
                {/* Type Icon */}
                <View
                  style={{ backgroundColor: typeConfig.bg }}
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                >
                  <Ionicons name={typeConfig.icon} size={22} color={typeConfig.color} />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-text-primary flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {isUnread && (
                      <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text className="text-xs text-text-secondary mt-1 leading-4" numberOfLines={2}>
                    {item.description || item.message}
                  </Text>
                  <Text className="text-[11px] text-text-muted mt-2">
                    {formatTime(item.createdAt || item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
