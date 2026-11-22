import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart-store";
import { ordersApi } from "@/lib/api/orders";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";

const ESTIMATED_DELIVERY_FEE = 60; // 60 BDT standard delivery

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const {
    items,
    removeItem,
    updateQuantity,
    toggleSelect,
    selectAll,
    clearSelected,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    getSelectedItems,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const selectedItems = getSelectedItems();
  const subtotal = getSubtotal();
  const deliveryFee = selectedItems.length > 0 ? ESTIMATED_DELIVERY_FEE : 0;
  const total = selectedItems.length > 0 ? Math.max(0, subtotal + deliveryFee - couponDiscount) : 0;
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await ordersApi.validateCoupon(couponInput.trim(), subtotal);
      if (response.data.valid) {
        applyCoupon(couponInput.trim(), response.data.discount_amount);
        setCouponInput("");
        Alert.alert("সফল", `কুপন সফলভাবে প্রয়োগ করা হয়েছে! ৳${response.data.discount_amount} ছাড়।`);
      } else {
        setCouponError(response.data.message || "কুপনটি সঠিক নয়");
      }
    } catch {
      // Demo / offline fallback: if test coupon "BOIMIX50"
      if (couponInput.trim().toUpperCase() === "BOIMIX50") {
        applyCoupon("BOIMIX50", 50);
        setCouponInput("");
        Alert.alert("সফল", "কুপন সফলভাবে প্রয়োগ করা হয়েছে! ৳50 ছাড়।");
      } else {
        setCouponError("কুপনটি সঠিক নয় বা মেয়াদ শেষ");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert("নির্বাচন করুন", "অনুগ্রহ করে চেকআউট করার জন্য অন্তত একটি বই নির্বাচন করুন।");
      return;
    }
    router.push("/checkout" as never);
  };

  // Group items by seller
  const sellerGroups: Record<string, typeof items> = {};
  items.forEach((item) => {
    const seller = item.book.author || "সাধারণ বিক্রেতা";
    if (!sellerGroups[seller]) sellerGroups[seller] = [];
    sellerGroups[seller].push(item);
  });

  return (
    <View className="flex-1 bg-surface-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-border-light shadow-sm"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-text-primary">আমার কার্ট</Text>
            <Text className="text-xs text-text-secondary">
              {getItemCount()}টি আইটেম
            </Text>
          </View>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            onPress={allSelected ? clearSelected : selectAll}
            className="px-2 py-1"
          >
            <Text className="text-xs text-primary font-semibold">
              {allSelected ? "সব বাতিল" : "সব নির্বাচন"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-surface-card border border-border items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={38} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-bold text-text-primary">কার্ট খালি আছে</Text>
          <Text className="text-sm text-text-secondary text-center mt-1 mb-6">
            আপনার পছন্দের বই খুঁজে কার্টে যোগ করুন
          </Text>
          <Button
            label="বই খুঁজুন"
            onPress={() => router.push("/tabs/explore" as never)}
            fullWidth={false}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Seller groups */}
          {Object.entries(sellerGroups).map(([sellerName, groupItems]) => (
            <View
              key={sellerName}
              className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm"
            >
              {/* Seller Header */}
              <View className="flex-row items-center gap-2 pb-3 mb-3 border-b border-border-light">
                <Ionicons name="storefront-outline" size={16} color={Colors.primary} />
                <Text className="text-sm font-bold text-text-primary flex-1">
                  {sellerName}
                </Text>
                <Text className="text-xs text-text-muted">আনুমানিক ডেলিভারি ২-৩ দিন</Text>
              </View>

              {/* Items */}
              {groupItems.map(({ book, quantity, selected }) => (
                <View
                  key={book.id}
                  className="flex-row items-center py-2.5 border-b border-border-light last:border-b-0"
                >
                  {/* Select Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleSelect(book.id)}
                    className="mr-3"
                  >
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={20}
                      color={selected ? Colors.primary : Colors.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Cover */}
                  <Image
                    source={{ uri: resolveMediaUrl(book.coverUrl) }}
                    style={{ width: 56, height: 76, borderRadius: 8 }}
                    contentFit="cover"
                  />

                  {/* Details */}
                  <View className="flex-1 ml-3 justify-between">
                    <View>
                      <Text
                        className="text-sm font-semibold text-text-primary"
                        numberOfLines={2}
                      >
                        {book.title}
                      </Text>
                      <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
                        {book.author}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-sm font-bold text-primary">
                        ৳{Number(book.price ?? 0) * quantity}
                      </Text>

                      {/* Stepper */}
                      <View className="flex-row items-center bg-surface-dark border border-border rounded-lg">
                        <TouchableOpacity
                          onPress={() => updateQuantity(book.id, quantity - 1)}
                          className="w-7 h-7 items-center justify-center"
                        >
                          <Ionicons name="remove" size={14} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text className="text-xs font-bold text-text-primary px-2">
                          {quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(book.id, quantity + 1)}
                          className="w-7 h-7 items-center justify-center"
                        >
                          <Ionicons name="add" size={14} color={Colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Remove Item */}
                  <TouchableOpacity
                    onPress={() => removeItem(book.id)}
                    className="ml-2 p-1 self-start"
                  >
                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          {/* Coupon Code Section */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-border-light shadow-sm">
            <Text className="text-sm font-bold text-text-primary mb-2">কুপন কোড</Text>
            {couponCode ? (
              <View className="flex-row items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="pricetag" size={16} color={Colors.success} />
                  <Text className="text-xs font-bold text-success">
                    {couponCode} (৳{couponDiscount} ছাড়)
                  </Text>
                </View>
                <TouchableOpacity onPress={removeCoupon}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-surface-dark border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary"
                    placeholder="কুপন কোড দিন (যেমন: BOIMIX50)"
                    placeholderTextColor="#9CA3AF"
                    value={couponInput}
                    onChangeText={setCouponInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    onPress={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className={`bg-primary px-4 py-2.5 rounded-xl ${!couponInput.trim() ? "opacity-50" : ""
                      }`}
                  >
                    <Text className="text-white text-xs font-bold">
                      {couponLoading ? "যাচাই..." : "প্রয়োগ"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {couponError ? (
                  <Text className="text-xs text-error mt-1.5">{couponError}</Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-2xl p-4 border border-border-light shadow-sm">
            <Text className="text-sm font-bold text-text-primary mb-3">হিসাব বিবরণী</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-text-secondary">উপমোট ({selectedItems.length}টি বই)</Text>
              <Text className="text-xs font-semibold text-text-primary">৳{subtotal}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-text-secondary">ডেলিভারি ফি</Text>
              <Text className="text-xs font-semibold text-text-primary">
                {selectedItems.length > 0 ? `৳${deliveryFee}` : "৳০"}
              </Text>
            </View>
            {couponDiscount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-success font-medium">কুপন ছাড়</Text>
                <Text className="text-xs font-bold text-success">-৳{couponDiscount}</Text>
              </View>
            )}
            <View className="h-px bg-border-light my-2" />
            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-text-primary">সর্বমোট</Text>
              <Text className="text-base font-bold text-primary">৳{total}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Sticky Checkout Bar */}
      {items.length > 0 && (
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-light p-4 shadow-md flex-row items-center justify-between"
        >
          <View>
            <Text className="text-xs text-text-secondary">মোট পরিশোধযোগ্য</Text>
            <Text className="text-xl font-bold text-primary">৳{total}</Text>
          </View>
          <View className="w-1/2">
            <Button
              label={`চেকআউট (${selectedItems.length})`}
              onPress={handleProceedCheckout}
              disabled={selectedItems.length === 0}
            />
          </View>
        </View>
      )}
    </View>
  );
}
