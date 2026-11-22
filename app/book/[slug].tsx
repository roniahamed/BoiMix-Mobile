import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { BookCard } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { BOOK_CONDITION_LABELS } from "@/types/book";
import { Colors } from "@/constants/theme";

export default function BookDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addItem);
  const { isWishlisted, toggleBook } = useWishlistStore();

  const wishlisted = isWishlisted(slug ?? "");

  // ── Fetch book detail ─────────────────────────────────────────────────────
  const { data: book, isLoading, isError } = useQuery({
    queryKey: queryKeys.books.detail(slug ?? ""),
    queryFn: () => booksApi.getBookDetail(slug ?? ""),
    select: (res) => res.data,
    enabled: !!slug,
  });

  // ── Fetch more from same seller ───────────────────────────────────────────
  const { data: sellerBooks } = useQuery({
    queryKey: queryKeys.books.byUser(book?.sellerId ?? ""),
    queryFn: () => booksApi.getBooks({ seller_id: book?.sellerId, page_size: 4 }),
    select: (res) => res.data.results.filter((b) => b.slug !== slug),
    enabled: !!book?.sellerId,
  });

  // ── Wishlist mutation ─────────────────────────────────────────────────────
  const wishlistMutation = useMutation({
    mutationFn: async (isCurrentlyWishlisted: boolean) => {
      if (isCurrentlyWishlisted) {
        await apiClient.delete(API_ENDPOINTS.ME.WISHLIST_ITEM(book!.id));
      } else {
        await apiClient.post(API_ENDPOINTS.ME.WISHLIST, { book_id: book!.id });
      }
    },
    onMutate: () => {
      toggleBook(book!.id);
    },
    onError: () => {
      toggleBook(book!.id);
      Alert.alert("ব্যর্থ", "উইশলিস্ট আপডেট করা যায়নি।");
    },
  });

  const handleWishlist = () => {
    if (!user) { router.push("/auth/login"); return; }
    wishlistMutation.mutate(wishlisted);
  };

  const handleAddToCart = () => {
    if (!user) { router.push("/auth/login"); return; }
    if (!book) return;
    addToCart(book);
    Alert.alert("যোগ হয়েছে", `"${book.title}" কার্টে যোগ করা হয়েছে।`);
  };

  const handleBuyNow = () => {
    if (!user) { router.push("/auth/login"); return; }
    if (!book) return;
    addToCart(book);
    router.push("/cart" as never);
  };

  const handleBorrow = () => {
    if (!user) { router.push("/auth/login"); return; }
    router.push({ pathname: "/borrow" as never, params: { bookId: book?.id } });
  };

  const handleExchange = () => {
    if (!user) { router.push("/auth/login"); return; }
    router.push({ pathname: "/exchange" as never, params: { bookId: book?.id } });
  };

  const handleShare = async () => {
    if (!book) return;
    await Share.share({
      message: `BoiMix-এ "${book.title}" দেখুন`,
      title: book.title,
    });
  };

  const isOwner = user?.id === book?.ownerId || user?.id === book?.sellerId;
  const conditionLabel = BOOK_CONDITION_LABELS.find((c) => c.value === book?.condition);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-sm text-text-secondary mt-3">লোড হচ্ছে...</Text>
      </View>
    );
  }

  // ── Error / Not Found ─────────────────────────────────────────────────────
  if (isError || !book) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="w-16 h-16 rounded-full bg-surface-dark items-center justify-center mb-3">
          <Ionicons name="book-outline" size={32} color={Colors.textMuted} />
        </View>
        <Text className="text-lg font-bold text-text-primary mb-1">বই পাওয়া যায়নি</Text>
        <Text className="text-sm text-text-secondary text-center mb-6">
          এই বইটি আর পাওয়া যাচ্ছে না বা সরিয়ে নেওয়া হয়েছে
        </Text>
        <Button label="ফিরে যান" onPress={() => router.back()} variant="outline" fullWidth={false} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View className="relative bg-surface-dark">
          <Image
            source={{ uri: book.coverUrl || "https://via.placeholder.com/400x300" }}
            style={{ width: "100%", height: 320 }}
            contentFit="cover"
            transition={300}
          />
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center shadow"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Wishlist & Share */}
          <View style={{ top: insets.top + 8 }} className="absolute right-4 gap-2">
            <TouchableOpacity
              onPress={handleWishlist}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center shadow"
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={20}
                color={wishlisted ? Colors.primary : "#FFFFFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center shadow"
            >
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-5">
          {/* Badges row */}
          <View className="flex-row gap-2 mb-3 flex-wrap">
            {book.availabilityMode && (
              <View className="bg-primary/10 px-2.5 py-1 rounded-md">
                <Text className="text-xs font-semibold text-primary">
                  {((
                    {
                      sell: "বিক্রয়",
                      exchange: "বিনিময়",
                      borrow: "ধার",
                      library: "লাইব্রেরি",
                    } as Record<string, string>
                  )[book.availabilityMode] ?? book.availabilityMode)}
                </Text>
              </View>
            )}
            {conditionLabel && (
              <View style={{ backgroundColor: conditionLabel.color + "20" }} className="px-2.5 py-1 rounded-md">
                <Text style={{ color: conditionLabel.color }} className="text-xs font-semibold">
                  {conditionLabel.labelBn}
                </Text>
              </View>
            )}
            {book.isOutOfStock && (
              <View className="bg-error/10 px-2.5 py-1 rounded-md">
                <Text className="text-xs font-semibold text-error">স্টক নেই</Text>
              </View>
            )}
          </View>

          {/* Title & Author */}
          <Text className="text-xl font-bold text-text-primary leading-7">{book.title}</Text>
          <TouchableOpacity onPress={() => book.authorSlug && router.push(`/user/${book.authorSlug}` as never)}>
            <Text className="text-sm text-primary font-medium mt-1">{book.author}</Text>
          </TouchableOpacity>

          {/* Rating */}
          {book.rating > 0 && (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text className="text-sm font-bold text-text-primary">{book.rating.toFixed(1)}</Text>
              <Text className="text-sm text-text-muted">({book.reviewCount} রিভিউ)</Text>
            </View>
          )}

          {/* Price */}
          <View className="mt-3 mb-5 py-2 border-y border-border-light">
            {book.availabilityMode === "borrow" ? (
              <Text className="text-2xl font-bold text-borrow">ধার নিন</Text>
            ) : book.availabilityMode === "exchange" ? (
              <Text className="text-2xl font-bold text-exchange">বিনিময় করুন</Text>
            ) : book.price ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-primary">৳{book.price}</Text>
                {book.originalPrice && book.originalPrice > book.price && (
                  <Text className="text-base text-text-muted line-through">৳{book.originalPrice}</Text>
                )}
              </View>
            ) : (
              <Text className="text-2xl font-bold text-success">বিনামূল্যে</Text>
            )}
          </View>

          {/* Location */}
          {book.location && (
            <View className="flex-row items-center gap-1.5 mb-4">
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text className="text-sm text-text-secondary">{book.location}</Text>
              {book.distance && (
                <Text className="text-sm text-text-muted">({book.distance})</Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {!isOwner ? (
            <View className="gap-3 mb-6">
              {book.availabilityMode === "sell" && !book.isOutOfStock && (
                <>
                  <Button
                    label="কার্টে যোগ করুন"
                    onPress={handleAddToCart}
                    variant="outline"
                    leftIcon={<Ionicons name="cart-outline" size={18} color={Colors.primary} />}
                  />
                  <Button label="এখনই কিনুন" onPress={handleBuyNow} />
                </>
              )}
              {book.availabilityMode === "exchange" && (
                <Button
                  label="বিনিময়ের প্রস্তাব পাঠান"
                  onPress={handleExchange}
                  leftIcon={<Ionicons name="repeat-outline" size={18} color="#FFFFFF" />}
                />
              )}
              {book.availabilityMode === "borrow" && !book.isOutOfStock && (
                <Button
                  label="ধার নিন"
                  onPress={handleBorrow}
                  leftIcon={<Ionicons name="book-outline" size={18} color="#FFFFFF" />}
                />
              )}
              {book.isOutOfStock && (
                <View className="bg-surface-dark rounded-xl p-4 items-center">
                  <Text className="text-sm text-text-secondary">এই বইটি এখন স্টকে নেই</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="gap-3 mb-6">
              <Button
                label="সম্পাদনা করুন"
                onPress={() => router.push({ pathname: "/upload" as never, params: { bookId: book.id } })}
                variant="outline"
                leftIcon={<Ionicons name="pencil-outline" size={18} color={Colors.primary} />}
              />
            </View>
          )}

          {/* Tags */}
          {book.tags?.length > 0 && (
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text-primary mb-2">ট্যাগ</Text>
              <View className="flex-row flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <View key={tag} className="bg-surface-dark border border-border-light rounded-full px-3 py-1">
                    <Text className="text-xs text-text-secondary">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* PDF Preview */}
          {book.hasPreviewPdf && book.previewPdfUrl && (
            <TouchableOpacity
              className="flex-row items-center gap-3 bg-info/10 border border-info rounded-xl p-4 mb-5"
              onPress={() => router.push({ pathname: "/near-me" as never })}
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.info} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-info">প্রিভিউ পড়ুন</Text>
                <Text className="text-xs text-text-secondary">
                  {book.previewPdfPages ? `${book.previewPdfPages} পৃষ্ঠা` : "পিডিএফ প্রিভিউ"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.info} />
            </TouchableOpacity>
          )}

          {/* More from Seller */}
          {sellerBooks && sellerBooks.length > 0 && (
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text-primary mb-3">
                এই বিক্রেতার আরো বই
              </Text>
              {sellerBooks.slice(0, 3).map((b) => (
                <BookCard key={b.id} book={b} variant="list" />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
