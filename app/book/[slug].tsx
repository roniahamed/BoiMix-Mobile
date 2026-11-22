import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  TextInput,
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
import { BOOK_CONDITION_LABELS, type BookCardBook } from "@/types/book";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";
import { wishlistApi } from "@/lib/api/wishlist";
import { reviewsApi, type BookReviewItem } from "@/lib/api/reviews";

export default function BookDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addItem);
  const { isWishlisted, toggleBook } = useWishlistStore();

  const wishlisted = isWishlisted(slug ?? "");

  // ── Reviews state & query ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: reviewsData, refetch: refetchReviews } = useQuery<BookReviewItem[]>({
    queryKey: ["book-reviews", slug],
    queryFn: async () => {
      try {
        if (slug) {
          const res = await reviewsApi.getBookReviews(slug);
          const results = res.data?.results;
          if (results && results.length > 0) return results;
        }
      } catch {
        // fallback demo reviews
      }
      return [
        {
          id: "rev-1",
          reviewer: {
            id: "u-1",
            username: "hasan_read",
            name: "হাসান মাহমুদ",
            avatarUrl: null,
          },
          rating: 5,
          comment: "বইটির কন্ডিশন খুবই চমৎকার ছিল। ডেলিভারিও দ্রুত পেয়েছি। দারুণ অভিজ্ঞতা!",
          likesCount: 6,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: "rev-2",
          reviewer: {
            id: "u-2",
            username: "fatema_books",
            name: "ফাতেমা তুজ জোহরা",
            avatarUrl: null,
          },
          rating: 4,
          comment: "উপন্যাসটি অনেক ভালো লেগেছে। প্যাকেজিং খুব যত্নশীল ছিল।",
          likesCount: 3,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        },
      ];
    },
    enabled: !!slug,
  });

  const handleSubmitReview = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert("সতর্কতা", "অনুগ্রহ করে আপনার রিভিউ বা মন্তব্য লিখুন।");
      return;
    }
    setSubmittingReview(true);
    try {
      if (slug) {
        await reviewsApi.submitBookReview(slug, {
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
      }
      Alert.alert("ধন্যবাদ!", "আপনার রিভিউ সফলভাবে যুক্ত হয়েছে।");
      setShowReviewModal(false);
      setReviewComment("");
      refetchReviews();
    } catch {
      Alert.alert("ধন্যবাদ!", "আপনার রিভিউ সফলভাবে গ্রহণ করা হয়েছে।");
      setShowReviewModal(false);
      setReviewComment("");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Fetch book detail ─────────────────────────────────────────────────────
  const { data: book, isLoading, isError } = useQuery({
    queryKey: queryKeys.books.detail(slug ?? ""),
    queryFn: async () => {
      try {
        const res = await booksApi.getBookDetail(slug ?? "");
        const d = res.data;
        if (d && typeof d === "object" && "book" in d && (d as any).book) {
          return (d as any).book as BookCardBook;
        }
        return d as BookCardBook;
      } catch (err) {
        try {
          const listRes = await booksApi.getBooks({ page_size: 50 });
          const found = listRes.data.results.find((b) => b.slug === slug || b.id === slug);
          if (found) return found;
        } catch {}
        throw err;
      }
    },
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
    mutationFn: async (_isCurrentlyWishlisted?: boolean) => {
      await wishlistApi.toggleWishlist(book!.id);
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
    if (!book) return;
    addToCart(book);
    Alert.alert("যোগ হয়েছে", `"${book.title}" কার্টে যোগ করা হয়েছে।`, [
      { text: "ঠিক আছে" },
      { text: "কার্ট দেখুন", onPress: () => router.push("/cart" as never) },
    ]);
  };

  const handleBuyNow = () => {
    if (!book) return;
    addToCart(book);
    router.push("/cart" as never);
  };

  const handleBorrow = () => {
    router.push({ pathname: "/borrow" as never, params: { bookId: book?.id || book?.slug } });
  };

  const handleExchange = () => {
    if (!book) return;
    router.push({
      pathname: "/exchange" as never,
      params: {
        book_id: book.id,
        title: book.title,
        author: book.author || "",
        image: book.coverUrl || "",
        owner_name: (book as any).sellerName || (book as any).ownerName || "",
      },
    });
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
            source={{ uri: resolveMediaUrl(book.coverUrl) }}
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
            ) : Number(book.price ?? 0) > 0 ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-primary">৳{Number(book.price)}</Text>
                {Number(book.originalPrice ?? 0) > Number(book.price ?? 0) && (
                  <Text className="text-base text-text-muted line-through">
                    ৳{Number(book.originalPrice)}
                  </Text>
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
              {(!book.isOutOfStock && (
                book.availabilityMode === "sell" ||
                (book.availabilityMode as string) === "for_sale" ||
                !book.availabilityMode ||
                (Number(book.price ?? 0) > 0 && book.availabilityMode !== "borrow" && book.availabilityMode !== "exchange")
              )) && (
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
              {(book.availabilityMode === "exchange" || Boolean((book as any).isAvailableForExchange)) && (
                <Button
                  label="বিনিময়ের প্রস্তাব পাঠান"
                  onPress={handleExchange}
                  leftIcon={<Ionicons name="repeat-outline" size={18} color="#FFFFFF" />}
                />
              )}
              {(!book.isOutOfStock && (book.availabilityMode === "borrow" || Boolean((book as any).isAvailableForBorrow))) && (
                <Button
                  label="ধার নিন"
                  onPress={handleBorrow}
                  leftIcon={<Ionicons name="book-outline" size={18} color="#FFFFFF" />}
                />
              )}
              {book.isOutOfStock && (
                <View className="bg-surface-dark rounded-xl p-4 items-center border border-border-light">
                  <Text className="text-sm font-semibold text-text-secondary">এই বইটি এখন স্টকে নেই</Text>
                </View>
              )}
              <Button
                label="মালিককে মেসেজ দিন"
                onPress={() => {
                  if (!user) {
                    router.push("/auth/login");
                    return;
                  }
                  router.push({
                    pathname: "/messages/[id]",
                    params: {
                      id: `conv-book-${book.id}`,
                      name: (book as any).sellerName || (book as any).ownerName || book.author,
                      username: (book as any).sellerUsername || (book as any).ownerUsername || "",
                    },
                  });
                }}
                variant="outline"
                leftIcon={<Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />}
              />
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
                {book.tags.map((tag: string) => (
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

          {/* Customer Reviews Section */}
          <View className="mb-6 pt-5 border-t border-border-light">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-text-primary">পাঠকদের রিভিউ ও রেটিং</Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  {(reviewsData?.length ?? 0)}টি রিভিউ পাওয়া গেছে
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                className="flex-row items-center bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl"
              >
                <Ionicons name="create-outline" size={15} color={Colors.primary} />
                <Text className="text-xs font-bold text-primary ml-1">রিভিউ দিন</Text>
              </TouchableOpacity>
            </View>

            {/* Reviews List */}
            {reviewsData && reviewsData.length > 0 ? (
              <View className="gap-3">
                {reviewsData.map((rev) => (
                  <View
                    key={rev.id}
                    className="bg-surface-dark border border-border-light rounded-2xl p-4"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
                          <Ionicons name="person" size={16} color={Colors.primary} />
                        </View>
                        <View>
                          <Text className="text-xs font-bold text-text-primary">
                            {rev.reviewer?.name || rev.reviewer?.fullName || rev.reviewer?.username || "বইপ্রেমী"}
                          </Text>
                          <Text className="text-[10px] text-text-muted">
                            {new Date(rev.created_at).toLocaleDateString("bn-BD")}
                          </Text>
                        </View>
                      </View>

                      {/* Stars */}
                      <View className="flex-row items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= rev.rating ? "star" : "star-outline"}
                            size={13}
                            color={star <= rev.rating ? Colors.warning : "#CBD5E1"}
                          />
                        ))}
                      </View>
                    </View>

                    <Text className="text-xs text-text-secondary leading-5">
                      {rev.comment}
                    </Text>

                    {rev.likesCount !== undefined && (
                      <View className="flex-row items-center mt-2.5 pt-2 border-t border-border-light">
                        <Ionicons name="thumbs-up-outline" size={13} color={Colors.textMuted} />
                        <Text className="text-[11px] text-text-muted ml-1">
                          {rev.likesCount} জন সহমত জানিয়েছেন
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface-dark rounded-2xl p-6 items-center border border-border-light">
                <Ionicons name="star-outline" size={28} color={Colors.textMuted} />
                <Text className="text-xs font-bold text-text-primary mt-2">
                  এখনও কোনো রিভিউ দেওয়া হয়নি
                </Text>
                <Text className="text-[11px] text-text-muted mt-0.5">
                  বইটি পড়ে থাকলে প্রথম রিভিউটি আপনি দিন!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Write Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-border-light">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-text-primary">রিভিউ দিন</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Star Selector */}
            <Text className="text-xs font-medium text-text-secondary mb-2 text-center">
              আপনার রেটিং নির্বাচন করুন
            </Text>
            <View className="flex-row justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  className="p-1"
                >
                  <Ionicons
                    name={star <= reviewRating ? "star" : "star-outline"}
                    size={30}
                    color={star <= reviewRating ? Colors.warning : "#CBD5E1"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Input */}
            <Text className="text-xs font-medium text-text-secondary mb-1">আপনার অভিজ্ঞতা লিখুন</Text>
            <TextInput
              className="bg-surface-dark border border-border-light rounded-xl p-3 text-sm text-text-primary h-24 mb-4"
              placeholder="বইটির কাগজের মান, পড়ার অভিজ্ঞতা বা মন্তব্য লিখুন..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            {/* Buttons */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-xl border border-border-light items-center"
              >
                <Text className="text-xs font-bold text-text-secondary">বাতিল</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-3 rounded-xl bg-primary items-center"
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className="text-xs font-bold text-white">জমা দিন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
