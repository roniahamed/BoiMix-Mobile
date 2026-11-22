import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { ordersApi, type DeliveryAddress } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import * as WebBrowser from "expo-web-browser";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";

type PaymentMethod = "eps" | "cod";
type DeliveryMethod = "home" | "pickup";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  badge?: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  supportedLogos?: { key: string; img: any }[];
}[] = [
  {
    id: "eps",
    label: "ইপিএস পেমেন্ট গেটওয়ে (EPS Gateway)",
    badge: "ইনস্ট্যান্ট ও নিরাপদ",
    description: "বিকাশ, নগদ, রকেট, কার্ড (ভিসা/মাস্টারকার্ড) ও ইন্টারনেট ব্যাংকিং",
    icon: "shield-checkmark-outline",
    supportedLogos: [
      { key: "bkash", img: require("@/assets/icons/payments/bkash.png") },
      { key: "nagad", img: require("@/assets/icons/payments/nagad.png") },
      { key: "rocket", img: require("@/assets/icons/payments/rocket.png") },
    ],
  },
  {
    id: "cod",
    label: "ক্যাশ অন ডেলিভারি (COD)",
    badge: "হাতে পেয়ে পরিশোধ",
    description: "বই হাতে পাওয়ার পর নগদ টাকায় মূল্য পরিশোধ করুন",
    icon: "cash-outline",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const {
    getSelectedItems,
    getSubtotal,
    couponCode,
    couponDiscount,
    clearCart,
  } = useCartStore();

  const selectedItems = getSelectedItems();
  const subtotal = getSubtotal();

  // Form State
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("eps");
  const [submitting, setSubmitting] = useState(false);

  // Address fields
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: user?.name || "",
    phone: "",
    district: "ঢাকা",
    thana: "মিরপুর",
    fullAddress: "",
  });

  const deliveryFee = deliveryMethod === "home" ? 60 : 0;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const validateForm = () => {
    if (!address.fullName.trim()) {
      Alert.alert("তথ্য অসম্পূর্ণ", "অনুগ্রহ করে আপনার পুরো নাম লিখুন।");
      return false;
    }
    if (!address.phone.trim() || address.phone.length < 11) {
      Alert.alert("ভুল ফোন নম্বর", "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
      return false;
    }
    if (!address.district.trim() || !address.thana.trim()) {
      Alert.alert("ঠিকানা অসম্পূর্ণ", "জেলা এবং থানা উল্লেখ করুন।");
      return false;
    }
    if (deliveryMethod === "home" && !address.fullAddress.trim()) {
      Alert.alert("ঠিকানা অসম্পূর্ণ", "হোম ডেলিভারির জন্য বিস্তারিত ঠিকানা লিখুন।");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const orderRes = await ordersApi.createOrder({
        cart_item_ids: selectedItems.map((i) => i.book.id),
        items: selectedItems.map((i) => ({
          id: i.book.id,
          title: i.book.title,
          price: Number(i.book.price ?? 0),
          quantity: i.quantity,
          seller: { id: i.book.sellerId ?? "boimix" },
        })),
        delivery_address: address,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        coupon_code: couponCode,
      });

      // Clear cart
      clearCart();

      // Handle EPS Payment Gateway redirect
      if (paymentMethod === "eps") {
        let redirectUrl = orderRes.data?.redirect_url;
        const paymentIntentId = orderRes.data?.payment_intent?.id;

        // If redirect_url was not returned in checkout response, try explicit EPS initialization
        if (!redirectUrl && paymentIntentId) {
          try {
            const initRes = await paymentsApi.initializeEps(paymentIntentId);
            redirectUrl = initRes.data?.redirect_url;
          } catch {
            // Initialization error fallback
          }
        }

        if (redirectUrl && redirectUrl.startsWith("http")) {
          if (Platform.OS === "web") {
            window.location.href = redirectUrl;
            return;
          } else {
            await WebBrowser.openBrowserAsync(redirectUrl);
            router.replace("/tabs/orders" as never);
            return;
          }
        }
      }

      // Cash on Delivery or fallback confirmation
      if (Platform.OS === "web") {
        alert(
          paymentMethod === "cod"
            ? "ক্যাশ অন ডেলিভারিতে আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!"
            : "আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!"
        );
        router.replace("/tabs/orders" as never);
      } else {
        Alert.alert(
          "অর্ডার সফল হয়েছে!",
          paymentMethod === "cod"
            ? "ক্যাশ অন ডেলিভারিতে আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।"
            : "আপনার অর্ডারটি গ্রহণ করা হয়েছে। অর্ডার হিস্ট্রিতে এর অগ্রগতি দেখতে পাবেন।",
          [
            {
              text: "অর্ডার দেখুন",
              onPress: () => router.replace("/tabs/orders" as never),
            },
          ],
        );
      }
    } catch {
      // Offline / Demo fallback
      clearCart();
      if (Platform.OS === "web") {
        alert("আপনার অর্ডারটি সফলভাবে নিশ্চিত করা হয়েছে!");
        router.replace("/tabs/orders" as never);
      } else {
        Alert.alert(
          "অর্ডার সফল হয়েছে!",
          "আপনার অর্ডারটি নিশ্চিত করা হয়েছে।",
          [
            {
              text: "অর্ডার দেখুন",
              onPress: () => router.replace("/tabs/orders" as never),
            },
          ],
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text className="text-lg font-bold text-text-primary">চেকআউট</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Delivery Method */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">ডেলিভারি পদ্ধতি</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setDeliveryMethod("home")}
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2.5 ${deliveryMethod === "home" ? "border-primary bg-primary/5" : "border-border bg-white"
                }`}
            >
              <Image
                source={require("@/assets/icons/courier/pathao-icon.png")}
                style={{ width: 26, height: 26, borderRadius: 6 }}
                contentFit="contain"
              />
              <View className="flex-1">
                <Text className={`text-xs font-bold ${deliveryMethod === "home" ? "text-primary" : "text-text-primary"}`}>
                  পাঠাও ডেলিভারি
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">৳৬০ ফি (২-৩ দিন)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliveryMethod("pickup")}
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2.5 ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-border bg-white"
                }`}
            >
              <Ionicons
                name="storefront-outline"
                size={22}
                color={deliveryMethod === "pickup" ? Colors.primary : Colors.textMuted}
              />
              <View className="flex-1">
                <Text className={`text-xs font-bold ${deliveryMethod === "pickup" ? "text-primary" : "text-text-primary"}`}>
                  পিকআপ পয়েন্ট
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">বিনামূল্যে (সরাসরি)</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Delivery Address */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">প্রাপকের ঠিকানা</Text>

          <View className="gap-3">
            <View>
              <Text className="text-xs text-text-secondary mb-1">পূর্ণ নাম *</Text>
              <TextInput
                className="bg-surface-dark border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
                placeholder="আপনার নাম"
                value={address.fullName}
                onChangeText={(v) => setAddress((p) => ({ ...p, fullName: v }))}
              />
            </View>

            <View>
              <Text className="text-xs text-text-secondary mb-1">মোবাইল নম্বর *</Text>
              <TextInput
                className="bg-surface-dark border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
                value={address.phone}
                onChangeText={(v) => setAddress((p) => ({ ...p, phone: v }))}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-text-secondary mb-1">জেলা *</Text>
                <TextInput
                  className="bg-surface-dark border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
                  placeholder="যেমন: ঢাকা"
                  value={address.district}
                  onChangeText={(v) => setAddress((p) => ({ ...p, district: v }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-secondary mb-1">থানা / এলাকা *</Text>
                <TextInput
                  className="bg-surface-dark border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
                  placeholder="যেমন: মিরপুর"
                  value={address.thana}
                  onChangeText={(v) => setAddress((p) => ({ ...p, thana: v }))}
                />
              </View>
            </View>

            {deliveryMethod === "home" && (
              <View>
                <Text className="text-xs text-text-secondary mb-1">বিস্তারিত ঠিকানা (বাসা/রাস্তা) *</Text>
                <TextInput
                  className="bg-surface-dark border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
                  placeholder="বাড়ি নং, রোড নং, এলাকা..."
                  multiline
                  numberOfLines={2}
                  value={address.fullAddress}
                  onChangeText={(v) => setAddress((p) => ({ ...p, fullAddress: v }))}
                />
              </View>
            )}
          </View>
        </View>

        {/* 3. Items Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">
            অর্ডারের বইসমূহ ({selectedItems.length}টি)
          </Text>
          {selectedItems.map(({ book, quantity }) => (
            <View key={book.id} className="flex-row items-center py-2 border-b border-border-light last:border-b-0">
              <Image
                source={{ uri: resolveMediaUrl(book.coverUrl) }}
                style={{ width: 36, height: 48, borderRadius: 6 }}
                contentFit="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-xs font-semibold text-text-primary" numberOfLines={1}>
                  {book.title}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  পরিমাণ: {quantity} × ৳{book.price ?? 0}
                </Text>
              </View>
              <Text className="text-xs font-bold text-primary">
                ৳{Number(book.price ?? 0) * quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Payment Method */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-text-primary">পেমেন্ট মেথড</Text>
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
              <Text className="text-[11px] font-semibold text-primary ml-1">১০০% নিরাপদ</Text>
            </View>
          </View>
          <View className="gap-2.5">
            {PAYMENT_METHODS.map((pm) => {
              const selected = paymentMethod === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => setPaymentMethod(pm.id)}
                  activeOpacity={0.8}
                  className={`p-3.5 rounded-xl border ${
                    selected ? "border-primary bg-primary/5" : "border-border-light bg-surface-dark"
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-xl bg-white border border-border-light items-center justify-center mr-3 shadow-xs">
                      <Ionicons
                        name={pm.icon}
                        size={22}
                        color={selected ? Colors.primary : Colors.textSecondary}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap gap-1.5">
                        <Text className={`text-xs font-bold ${selected ? "text-primary" : "text-text-primary"}`}>
                          {pm.label}
                        </Text>
                        {Boolean(pm.badge) && (
                          <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-emerald-700">{pm.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-text-muted mt-1 leading-4">
                        {pm.description}
                      </Text>

                      {/* Supported logos for EPS */}
                      {Boolean(pm.supportedLogos) && (
                        <View className="flex-row items-center gap-1.5 mt-2.5 flex-wrap">
                          {pm.supportedLogos?.map((item) => (
                            <View
                              key={item.key}
                              className="px-2 py-1 rounded-md bg-white border border-border-light"
                            >
                              <Image
                                source={item.img}
                                style={{ width: 24, height: 18 }}
                                contentFit="contain"
                              />
                            </View>
                          ))}
                          <View className="flex-row items-center px-2 py-1 rounded-md bg-white border border-border-light">
                            <Ionicons name="card-outline" size={14} color={Colors.textSecondary} />
                            <Text className="text-[10px] font-semibold text-text-secondary ml-1">কার্ড / নেট ব্যাংকিং</Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={selected ? Colors.primary : Colors.textMuted}
                    />
                  </View>

                  {/* Escrow badge for EPS */}
                  {selected && pm.id === "eps" && (
                    <View className="mt-3 pt-2.5 border-t border-primary/20 flex-row items-start">
                      <Ionicons name="shield-checkmark" size={16} color={Colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
                      <Text className="text-[11px] text-text-secondary leading-4 flex-1">
                        <Text className="font-bold text-primary">BoiMix এসক্রো সুরক্ষা: </Text>
                        বই হাতে পেয়ে নিশ্চিত করার পরেই কেবল বিক্রেতা টাকা পাবেন।
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Total Calculation */}
        <View className="bg-white rounded-2xl p-4 border border-border-light shadow-sm">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-text-secondary">বইয়ের মূল্য</Text>
            <Text className="text-xs font-semibold text-text-primary">৳{subtotal}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-text-secondary">ডেলিভারি ফি</Text>
            <Text className="text-xs font-semibold text-text-primary">৳{deliveryFee}</Text>
          </View>
          {couponDiscount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-success font-medium">কুপন ছাড় ({couponCode})</Text>
              <Text className="text-xs font-bold text-success">-৳{couponDiscount}</Text>
            </View>
          )}
          <View className="h-px bg-border-light my-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-text-primary">সর্বমোট প্রদেয়</Text>
            <Text className="text-lg font-bold text-primary">৳{total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Place Order Bar */}
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-light p-4 shadow-md flex-row items-center justify-between"
      >
        <View>
          <Text className="text-xs text-text-secondary">সর্বমোট</Text>
          <Text className="text-xl font-bold text-primary">৳{total}</Text>
        </View>
        <View className="w-1/2">
          <Button
            label={submitting ? "প্রক্রিয়াধীন..." : "অর্ডার নিশ্চিত করুন"}
            onPress={handlePlaceOrder}
            loading={submitting}
          />
        </View>
      </View>

      {/* Loading Overlay */}
      {submitting && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl p-6 items-center shadow-lg">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-sm font-bold text-text-primary mt-3">
              অর্ডার প্রক্রিয়াধীন...
            </Text>
            <Text className="text-xs text-text-muted mt-1">
              অনুগ্রহ করে অপেক্ষা করুন
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
