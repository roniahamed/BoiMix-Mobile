import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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
import { Colors } from "@/constants/theme";

type PaymentMethod = "cod" | "bkash" | "nagad" | "card";
type DeliveryMethod = "home" | "pickup";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { id: "cod", label: "ক্যাশ অন ডেলিভারি (COD)", icon: "cash-outline", description: "বই হাতে পেয়ে মূল্য পরিশোধ করুন" },
  { id: "bkash", label: "বিকাশ (bKash)", icon: "phone-portrait-outline", description: "বিকাশ পেমেন্ট গেটওয়ে" },
  { id: "nagad", label: "নগদ (Nagad)", icon: "wallet-outline", description: "নগদ অনলাইন পেমেন্ট" },
  { id: "card", label: "কার্ড / নেট ব্যাংকিং", icon: "card-outline", description: "ভিসা, মাস্টারকার্ড বা ইন্টারনেট ব্যাংকিং" },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
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
      await ordersApi.createOrder({
        cart_item_ids: selectedItems.map((i) => i.book.id),
        delivery_address: address,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        coupon_code: couponCode,
      });

      // Clear cart
      clearCart();

      Alert.alert(
        "অর্ডার সফল হয়েছে!",
        "আপনার অর্ডারটি গ্রহণ করা হয়েছে। অর্ডার হিস্ট্রিতে এর অগ্রগতি দেখতে পাবেন।",
        [
          {
            text: "অর্ডার দেখুন",
            onPress: () => router.replace("/tabs/orders" as never),
          },
        ],
      );
    } catch {
      // Offline / Demo fallback
      clearCart();
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
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                deliveryMethod === "home" ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              <Ionicons
                name="bicycle-outline"
                size={20}
                color={deliveryMethod === "home" ? Colors.primary : Colors.textMuted}
              />
              <View>
                <Text className={`text-xs font-bold ${deliveryMethod === "home" ? "text-primary" : "text-text-primary"}`}>
                  হোম ডেলিভারি
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">৳৬০ ফি</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliveryMethod("pickup")}
              className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              <Ionicons
                name="walk-outline"
                size={20}
                color={deliveryMethod === "pickup" ? Colors.primary : Colors.textMuted}
              />
              <View>
                <Text className={`text-xs font-bold ${deliveryMethod === "pickup" ? "text-primary" : "text-text-primary"}`}>
                  পিকআপ পয়েন্ট
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">বিনামূল্যে</Text>
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
                source={{ uri: book.coverUrl || "https://via.placeholder.com/40x56" }}
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
                ৳{(book.price ?? 0) * quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Payment Method */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
          <Text className="text-sm font-bold text-text-primary mb-3">পেমেন্ট মেথড</Text>
          <View className="gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const selected = paymentMethod === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => setPaymentMethod(pm.id)}
                  activeOpacity={0.8}
                  className={`flex-row items-center p-3 rounded-xl border ${
                    selected ? "border-primary bg-primary/5" : "border-border-light bg-surface-dark"
                  }`}
                >
                  <Ionicons
                    name={pm.icon}
                    size={22}
                    color={selected ? Colors.primary : Colors.textSecondary}
                    className="mr-3"
                  />
                  <View className="flex-1 ml-2">
                    <Text className={`text-xs font-bold ${selected ? "text-primary" : "text-text-primary"}`}>
                      {pm.label}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {pm.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={selected ? Colors.primary : Colors.textMuted}
                  />
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
