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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { ordersApi, type Order } from "@/lib/api/orders";
import { resolveMediaUrl } from "@/lib/utils/media";
import { useAuthStore } from "@/stores/auth-store";

const TRACKING_STEPS = [
  {
    step: 1,
    id: "placed",
    title: "অর্ডার গ্রহণ",
    desc: "অর্ডারটি সফলভাবে জমা হয়েছে",
  },
  {
    step: 2,
    id: "confirmed",
    title: "অর্ডার নিশ্চিত",
    desc: "বিক্রেতা কর্তৃক অর্ডারটি নিশ্চিত করা হয়েছে",
  },
  {
    step: 3,
    id: "shipped",
    title: "কুরিয়ারে হস্তান্তর",
    desc: "পার্সেলটি পাঠাও কুরিয়ার হাবে পৌঁছেছে",
  },
  {
    step: 4,
    id: "out_for_delivery",
    title: "ডেলিভারির পথে",
    desc: "ডেলিভারি রাইডার আপনার ঠিকানায় আসছে",
  },
  {
    step: 5,
    id: "delivered",
    title: "ডেলিভারি সম্পন্ন",
    desc: "গ্রাহক বইটি বুঝে পেয়েছেন",
  },
];

export default function OrderTrackingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [copied, setCopied] = useState(false);

  // Fetch Order
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order-detail", id],
    queryFn: async () => {
      if (id && user) {
        try {
          const res = await ordersApi.getOrderDetail(id);
          if (res.data) return res.data;
        } catch {
          // Fallback demo order
        }
      }
      return {
        id: id || "bm-ord-8921",
        orderNumber: "BM-8921",
        status: "shipped",
        totalAmount: 480,
        deliveryAddress: "বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা",
        paymentMethod: "cod",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        items: [
          {
            id: "item-1",
            book: {
              id: "bk-1",
              title: "দেয়াল",
              author: "হুমায়ূন আহমেদ",
              price: 320,
              coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
              slug: "deyal",
              condition: "like_new",
              rating: 4.8,
              reviewCount: 30,
              tags: ["উপন্যাস"],
              availability: "in-stock",
            },
            quantity: 1,
            price: 320,
          },
          {
            id: "item-2",
            book: {
              id: "bk-2",
              title: "চাঁদের পাহাড়",
              author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
              price: 160,
              coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
              slug: "chander-pahar",
              condition: "good",
              rating: 4.9,
              reviewCount: 42,
              tags: ["অ্যাডভেঞ্চার"],
              availability: "in-stock",
            },
            quantity: 1,
            price: 160,
          },
        ],
      } as unknown as Order;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (id) {
        await ordersApi.cancelOrder(id);
      }
    },
    onSuccess: () => {
      Alert.alert("অর্ডার বাতিল", "আপনার অর্ডারটি সফলভাবে বাতিল করা হয়েছে।");
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["me", "orders"] });
    },
    onError: () => {
      Alert.alert("বিজ্ঞপ্তি", "অর্ডারটি প্রসেসিং হয়ে যাওয়ায় এখন স্বয়ংক্রিয়ভাবে বাতিল করা সম্ভব নয়। সাপোর্টে যোগাযোগ করুন।");
    },
  });

  const handleCancel = () => {
    Alert.alert(
      "অর্ডার বাতিল নিশ্চিতকরণ",
      "আপনি কি নিশ্চিতভাবে এই অর্ডারটি বাতিল করতে চান?",
      [
        { text: "না", style: "cancel" },
        { text: "হ্যাঁ, বাতিল করুন", style: "destructive", onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  if (isLoading || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-white" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-xs text-text-muted mt-2">অর্ডার লোড হচ্ছে...</Text>
      </View>
    );
  }

  // Determine current tracking step
  let currentStepIndex = 1;
  if (order.status === "confirmed") currentStepIndex = 2;
  if (order.status === "shipped") currentStepIndex = 3;
  if (order.status === "delivered") currentStepIndex = 5;
  if (order.status === "cancelled") currentStepIndex = 0;

  const orderNum = order.orderNumber || order.order_number || (id ? id.slice(0, 8).toUpperCase() : "BM-0000");

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3 bg-white border-b border-border-light flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-bold text-text-primary">অর্ডার ট্র্যাকিং</Text>
            <Text className="text-xs text-text-muted">আইডি: #{orderNum}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/messages")}
          className="w-9 h-9 rounded-full bg-surface-dark items-center justify-center border border-border-light"
        >
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View className="bg-primary rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-white/80 font-medium">ডেলিভারি স্ট্যাটাস</Text>
            <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-white capitalize">
                {order.status === "shipped"
                  ? "কুরিয়ারে হস্তান্তর"
                  : order.status === "delivered"
                  ? "ডেলিভারি সম্পন্ন"
                  : order.status === "cancelled"
                  ? "বাতিলকৃত"
                  : "প্রসেসিং হচ্ছে"}
              </Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-white">
            {order.status === "delivered"
              ? "অর্ডারটি সফলভাবে ডেলিভার হয়েছে"
              : order.status === "cancelled"
              ? "অর্ডারটি বাতিল করা হয়েছে"
              : "আপনার বই গন্তব্যের উদ্দেশ্যে পথে রয়েছে"}
          </Text>
          <Text className="text-xs text-white/80 mt-1">
            সম্ভাব্য ডেলিভারি সময়: আগামী ২ কার্যদিবসের মধ্যে
          </Text>
        </View>

        {/* Courier Partner & Tracking Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-border-light">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center mr-3 border border-red-100">
                <Ionicons name="bicycle-outline" size={20} color="#EF4444" />
              </View>
              <View>
                <Text className="text-xs font-bold text-text-primary">পাঠাও কুরিয়ার সার্ভিস</Text>
                <Text className="text-[11px] text-text-muted">হোম ডেলিভারি পার্টনার</Text>
              </View>
            </View>
            <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Text className="text-[10px] font-bold text-emerald-700">লাইভ ট্র্যাকিং</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between bg-surface-dark p-3 rounded-xl">
            <View>
              <Text className="text-[11px] text-text-muted">কনসাইনমেন্ট ট্র্যাকিং কোড</Text>
              <Text className="text-sm font-bold text-text-primary mt-0.5">PT-8941203</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-border-light"
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color={copied ? Colors.primary : Colors.textPrimary}
              />
              <Text className="text-xs font-semibold text-text-primary ml-1">
                {copied ? "কপি হয়েছে" : "কপি করুন"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step-by-Step Delivery Stepper */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-4">ডেলিভারি টাইমলাইন</Text>

          <View className="relative pl-1">
            {TRACKING_STEPS.map((st, idx) => {
              const isPastOrCurrent = st.step <= currentStepIndex;
              const isCurrent = st.step === currentStepIndex;
              const isLast = idx === TRACKING_STEPS.length - 1;

              return (
                <View key={st.id} className="flex-row mb-4 last:mb-0">
                  {/* Left Column (Icon + Line) */}
                  <View className="items-center mr-3.5">
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center border-2 ${
                        isCurrent
                          ? "bg-primary border-primary"
                          : isPastOrCurrent
                          ? "bg-emerald-600 border-emerald-600"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {isPastOrCurrent ? (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      ) : (
                        <View className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        className={`w-0.5 flex-1 my-1 ${
                          isPastOrCurrent && !isCurrent ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </View>

                  {/* Right Column (Texts) */}
                  <View className="flex-1 pb-1">
                    <Text
                      className={`text-sm ${
                        isCurrent
                          ? "font-bold text-primary"
                          : isPastOrCurrent
                          ? "font-semibold text-text-primary"
                          : "font-normal text-text-muted"
                      }`}
                    >
                      {st.title}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-0.5 leading-4">
                      {st.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ordered Items */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">
            অর্ডারের বইসমূহ ({order.items?.length || 0}টি)
          </Text>

          {order.items?.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center py-2.5 border-b border-border-light last:border-b-0"
            >
              <Image
                source={{ uri: resolveMediaUrl(item.book?.coverUrl) }}
                style={{ width: 44, height: 60, borderRadius: 6 }}
                contentFit="cover"
              />
              <View className="flex-1 ml-3.5">
                <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                  {item.book?.title}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">{item.book?.author}</Text>
                <Text className="text-xs font-medium text-text-secondary mt-1">
                  {item.quantity}টি × ৳{item.price}
                </Text>
              </View>
              <Text className="text-sm font-bold text-primary">
                ৳{item.quantity * item.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address & Payment */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">ডেলিভারি ও পেমেন্ট বিবরণ</Text>

          <View className="gap-2.5">
            <View className="flex-row items-start">
              <Ionicons name="location-outline" size={18} color={Colors.textMuted} className="mr-2" />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-bold text-text-primary">ডেলিভারি ঠিকানা</Text>
                <Text className="text-xs text-text-secondary mt-0.5 leading-4">
                  {order.deliveryAddress || "ধানমন্ডি, ঢাকা"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start pt-2 border-t border-border-light">
              <Ionicons name="wallet-outline" size={18} color={Colors.textMuted} className="mr-2" />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-bold text-text-primary">পেমেন্ট মেথড</Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  {order.paymentMethod === "cod" ? "ক্যাশ অন ডেলিভারি (COD)" : "অনলাইন পেমেন্ট"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Summary */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">মূল্য বিবরণী</Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-text-secondary">বইয়ের মোট মূল্য</Text>
              <Text className="text-xs font-medium text-text-primary">৳{order.totalAmount - 60 > 0 ? order.totalAmount - 60 : order.totalAmount}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-text-secondary">ডেলিভারি চার্জ</Text>
              <Text className="text-xs font-medium text-text-primary">৳৬০</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-border-light">
              <Text className="text-sm font-bold text-text-primary">সর্বমোট প্রদেয়</Text>
              <Text className="text-base font-bold text-primary">৳{order.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Cancel Order Action (if pending) */}
        {order.status === "pending" && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex-row items-center justify-center gap-2 bg-red-50 border border-error/20 rounded-2xl p-3.5 mb-6"
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                <Text className="text-error font-bold text-sm">অর্ডার বাতিল করুন</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
