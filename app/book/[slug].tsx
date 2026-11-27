import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  PanResponder,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

import { BookHorizontalList } from "@/components/home/BookHorizontalList";
import { Button } from "@/components/ui/Button";
import { pdfReaderHtml } from "@/lib/utils/pdf-reader";
import { BookCard } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCartConfirmationStore } from "@/stores/cart-confirmation-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { BOOK_CONDITION_LABELS, type BookCardBook } from "@/types/book";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";
import { toggleWishlist } from "@/lib/wishlist-sync";
import { reviewsApi, type BookReviewItem } from "@/lib/api/reviews";
import { shareContent } from "@/lib/utils/share";
import { isCartReadyForCurrentAccount } from "@/lib/cart-ready";

const coverEntrance = FadeInDown.duration(340).reduceMotion(ReduceMotion.System);

export default function BookDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <BookDetailContent key={slug} />;
}

function BookDetailContent() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setIsFocused(true);
    return () => setIsFocused(false);
  }, []));

  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((state) => state.scopeId === (user?.id ?? null) ? state.items.reduce((sum, item) => sum + item.quantity, 0) : 0);
  const addToCart = useCartStore((s) => s.addItem);
  const showCartConfirmation = useCartConfirmationStore((s) => s.show);
  const bookIds = useWishlistStore((state) => state.bookIds);
  const wishlistScopeId = useWishlistStore((state) => state.scopeId);

  // ── Images & Gallery state ──
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // ── PDF preview modal state ──
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfRetry, setPdfRetry] = useState(0);

  // ── Chat creation state ──
  const [creatingChat, setCreatingChat] = useState(false);

  // ── Reviews state & query ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: reviewsData, isError: reviewsError, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery<BookReviewItem[]>({
    queryKey: ["book-reviews", slug],
    queryFn: async () => {
      if (!slug) return [];
      const res = await reviewsApi.getBookReviews(slug);
      return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
    },
    enabled: !!slug,
  });

  const voteReviewMutation = useMutation({
    mutationFn: async ({ reviewId, vote }: { reviewId: string; vote: "upvote" | "downvote" }) => {
      return reviewsApi.voteReview(reviewId, vote);
    },
    onSuccess: () => {
      refetchReviews();
    },
    onError: (err: any) => {
      Alert.alert("ত্রুটি", err?.response?.data?.message || err?.message || "ভোট গ্রহণ করা সম্ভব হয়নি।");
    },
  });

  const handleVoteReview = (reviewId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    voteReviewMutation.mutate({ reviewId, vote: "upvote" });
  };

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
      Alert.alert("রিভিউ জমা হয়নি", "আবার চেষ্টা করুন।");
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
          const b = (d as any).book;
          const owner = (d as any).owner;
          return {
            ...b,
            recommended: d.recommended,
            owner,
            sellerId: b.sellerId || owner?.id,
            ownerId: b.ownerId || owner?.id,
            sellerName: owner?.name || owner?.username,
            sellerUsername: owner?.username,
          } as BookCardBook & { recommended?: BookCardBook[]; owner?: any; sellerName?: string; sellerUsername?: string };
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
  const handleWishlist = () => {
    if (book) toggleWishlist(book.id);
  };

  const handleAddToCart = () => {
    if (!book || !isCartReadyForCurrentAccount()) return;
    showCartConfirmation(book.title);
    addToCart(book);
  };

  const handleBuyNow = () => {
    if (!book || !isCartReadyForCurrentAccount()) return;
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

  const handleMessageOwner = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (isOwner) {
      Alert.alert("তথ্য", "এটি আপনার নিজের বইয়ের লিস্টিং।");
      return;
    }
    if (!book) return;

    const sellerId = book.sellerId || (book as any).ownerId;
    const sellerUsername = (book as any).sellerUsername || (book as any).ownerUsername || (book as any).owner?.username;
    const sellerDisplayName = (book as any).sellerName || (book as any).ownerName || (book as any).owner?.name || book.author;
    const sellerAvatar = (book as any).owner?.avatarUrl;

    setCreatingChat(true);
    try {
      const res = await messagesApi.createConversation({
        recipient_id: sellerId && sellerId.includes("-") ? sellerId : undefined,
        recipient_username: sellerUsername || (!sellerId?.includes("-") ? sellerId : undefined),
        context_type: "book",
        context_id: book.id,
        initial_message: `বই সম্পর্কিত বার্তা: "${book.title}"`,
      });
      const conv = res.data;
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: conv.id,
          name: sellerDisplayName,
          username: sellerUsername || "",
          avatar: sellerAvatar || "",
        },
      });
    } catch {
      Alert.alert("মেসেজ খোলা যায়নি", "আবার চেষ্টা করুন।");
    } finally {
      setCreatingChat(false);
    }
  };

  const handleViewSellerProfile = () => {
    const targetUsername =
      (book as any)?.owner?.username ||
      (book as any)?.sellerUsername ||
      (book as any)?.owner?.id ||
      book?.sellerId;
    if (targetUsername) {
      router.push(`/user/${targetUsername}` as never);
    }
  };

  const rawPreviewUrl = resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url);
  // Cloudinary serves PDF-compatible Illustrator uploads with the requested delivery format.
  const previewUrl = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(rawPreviewUrl)
    ? rawPreviewUrl.replace(/\.ai(?=$|[?#])/i, ".pdf")
    : rawPreviewUrl;

  const handleOpenPdfPreview = () => {
    if (!previewUrl) {
      Alert.alert("দুঃখিত", "এই বইটির কোনো প্রিভিউ পিডিএফ পাওয়া যায়নি।");
      return;
    }
    setShowPdfModal(true);
  };

  const handleShare = async () => {
    if (!book) return;
    const url =
      typeof window !== "undefined" && window.location?.origin
        ? `${window.location.origin}/book/${book.slug}`
        : `https://boimix.com/book/${book.slug}`;
    await shareContent({
      title: book.title,
      message: `BoiMix-এ "${book.title}" বইটি দেখুন:`,
      url,
      successMessage: `"${book.title}" বইটির লিংক ক্লিপবোর্ডে কপি করা হয়েছে।`,
    });
  };

  const wishlisted = book ? wishlistScopeId === (user?.id ?? null) && bookIds.has(book.id) : false;
  const isOwner = Boolean(user?.id && (user.id === book?.ownerId || user.id === book?.sellerId));
  const conditionLabel = BOOK_CONDITION_LABELS.find((c) => c.value === book?.condition);
  const isOutOfStock = Boolean(book?.isOutOfStock || book?.availability === "out-of-stock");
  const canBuy = Boolean(book && !isOutOfStock && (
    book.availabilityMode === "sell" || (book.availabilityMode as string) === "for_sale" ||
    !book.availabilityMode || (Number(book.price ?? 0) > 0 && book.availabilityMode !== "borrow" && book.availabilityMode !== "exchange")
  ));
  const canExchange = Boolean(book && !isOutOfStock && (book.availabilityMode === "exchange" || (book as any).isAvailableForExchange));
  const canBorrow = Boolean(book && !isOutOfStock && (book.availabilityMode === "borrow" || (book as any).isAvailableForBorrow));

  // Extract all images (frontCover, backCover, insidePages, tocImage, indexImage, etc.)
  const allImages: { url: string; label: string }[] = [];
  if (book && Array.isArray((book as any).images) && (book as any).images.length > 0) {
    (book as any).images.forEach((img: any, idx: number) => {
      const src = typeof img === "string" ? img : img?.src || img?.url || img?.originalUrl;
      if (src && !allImages.some((i) => i.url === src)) {
        let label = `ছবি ${idx + 1}`;
        if (img?.type === "frontCover") label = "সামনের প্রচ্ছদ";
        else if (img?.type === "backCover") label = "পেছনের প্রচ্ছদ";
        else if (img?.type === "insidePages") label = "ভেতরের পাতা";
        else if (img?.type === "tocImage") label = "সূচিপত্র";
        else if (img?.type === "indexImage") label = "ইনডেক্স পাতা";
        allImages.push({ url: src, label });
      }
    });
  }
  if (allImages.length === 0 && book?.coverUrl) {
    allImages.push({ url: book.coverUrl, label: "মূল প্রচ্ছদ" });
  }

  const imageCount = allImages.length;
  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      imageCount > 1 && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 40) return;
      setActiveImageIndex((current) =>
        Math.max(0, Math.min(imageCount - 1, current + (gesture.dx < 0 ? 1 : -1)))
      );
    },
  }), [imageCount]);

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
    <View className="flex-1 bg-surface-dark">
      {isFocused ? <StatusBar style="dark" /> : null}
      <View style={{ backgroundColor: Colors.background, paddingTop: insets.top + 4, paddingBottom: 14 }} className="flex-row items-center px-2">
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="ফিরে যান" onPress={() => router.back()} className="w-11 h-11 items-center justify-center">
          <Ionicons name="arrow-back" size={23} color={Colors.secondary} />
        </TouchableOpacity>
        <View className="flex-1 ml-1">
          <Image source={require("@/assets/images/boimix-logo-transparent.png")} style={{ width: "100%", maxWidth: 118, height: 40 }} contentFit="contain" accessibilityLabel="BoiMix" />
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="সার্চ" onPress={() => router.push("/search")} className="w-11 h-11 items-center justify-center">
          <Ionicons name="search-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`কার্ট, ${cartCount}টি বই`} onPress={() => router.push("/cart")} className="w-11 h-11 items-center justify-center">
          <Ionicons name="cart-outline" size={24} color={Colors.secondary} />
          {cartCount > 0 ? <View className="absolute right-0 top-0 rounded-full bg-error px-1"><Text className="text-xs font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text></View> : null}
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="উইশলিস্ট" accessibilityState={{ selected: wishlisted }} onPress={handleWishlist} className="w-11 h-11 items-center justify-center">
          <Ionicons name={wishlisted ? "heart" : "heart-outline"} size={23} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="শেয়ার করুন" onPress={handleShare} className="w-11 h-11 items-center justify-center">
          <Ionicons name="share-social-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>

      </View>
      <ScrollView key={slug} style={{ backgroundColor: Colors.background }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Cover / Multi-Image Carousel */}
        <View className="relative bg-surface-dark overflow-hidden py-4">
          <View pointerEvents="none" style={{ position: "absolute", alignSelf: "center", top: 45, width: 245, height: 155, borderRadius: 75, backgroundColor: "#EFF4EF", transform: [{ rotate: "12deg" }] }} />
          {Boolean(resolveMediaUrl(allImages[activeImageIndex]?.url || book.coverUrl || (book as any).cover_image_url || (book as any).coverImage)) ? (
            <Animated.View key={activeImageIndex} entering={coverEntrance} {...swipeResponder.panHandlers}>
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setFullScreenImage(allImages[activeImageIndex]?.url || book.coverUrl || (book as any).cover_image_url || (book as any).coverImage)}
              >
                <Image
                  source={{
                    uri: resolveMediaUrl(
                      allImages[activeImageIndex]?.url ||
                        book.coverUrl ||
                        (book as any).cover_image_url ||
                        (book as any).coverImage
                    ),
                  }}
                  style={{ width: "100%", height: 230 }}
                  contentFit="contain"
                  transition={200}
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View
              style={{ width: "100%", height: 230 }}
              className="bg-slate-100 items-center justify-center border-b border-border-light"
            >
              <Ionicons name="book-outline" size={60} color={Colors.textMuted} />
              <Text className="text-xs text-text-muted mt-2 font-medium">কোনো প্রচ্ছদ ছবি নেই</Text>
            </View>
          )}

          {/* Image index counter badge if multiple images */}
          {allImages.length > 1 && (
            <View className="absolute bottom-3 right-4 bg-black/60 px-2.5 py-1 rounded-full flex-row items-center gap-1">
              <Ionicons name="images-outline" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">
                {activeImageIndex + 1} / {allImages.length}
              </Text>
            </View>
          )}

          {/* Current image label badge (e.g. সামনের প্রচ্ছদ, ভেতরের পাতা) */}
          {Boolean(allImages[activeImageIndex]?.label) && (
            <View className="absolute bottom-3 left-4 bg-black/60 px-2.5 py-1 rounded-md">
              <Text className="text-white text-[11px] font-semibold">
                {allImages[activeImageIndex].label}
              </Text>
            </View>
          )}

          {/* Left / Right Nav Arrows if multiple images */}
          {allImages.length > 1 && (
            <>
              {activeImageIndex > 0 && (
                <TouchableOpacity
                  onPress={() => setActiveImageIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-3 top-1/2 -mt-4 w-8 h-8 rounded-full bg-black/40 items-center justify-center"
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {activeImageIndex < allImages.length - 1 && (
                <TouchableOpacity
                  onPress={() => setActiveImageIndex((prev) => Math.min(allImages.length - 1, prev + 1))}
                  className="absolute right-3 top-1/2 -mt-4 w-8 h-8 rounded-full bg-black/40 items-center justify-center"
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}


        </View>

        {/* Thumbnails row if multiple images */}
        {allImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}
            className="bg-surface-dark border-b border-border-light"
          >
            {allImages.map((img, idx) => {
              const isSelected = activeImageIndex === idx;
              return (
                <TouchableOpacity
                  key={img.url + idx}
                  onPress={() => setActiveImageIndex(idx)}
                  className={`rounded-xl overflow-hidden border-2 items-center ${
                    isSelected ? "border-primary" : "border-border-light opacity-70"
                  }`}
                  style={{ width: 62 }}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(img.url) }}
                    style={{ width: 58, height: 72 }}
                    contentFit="cover"
                  />
                  <View className="bg-surface-dark w-full py-0.5 items-center">
                    <Text className={`text-[9px] font-bold ${isSelected ? "text-primary" : "text-text-muted"}`} numberOfLines={1}>
                      {img.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {previewUrl ? (
          <TouchableOpacity accessibilityRole="button" onPress={handleOpenPdfPreview}
            className="mx-5 mt-3 rounded-xl bg-primary flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="book-outline" size={21} color="#FFFFFF" />
            <Text className="text-white text-base font-bold">একটু পড়ে দেখুন</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}

        <View className="p-5">
          {/* Title & Author */}
          <Text className="text-2xl font-bold text-text-primary leading-8">{book.title}</Text>
          <Text className="text-sm text-primary font-medium mt-1 mb-3">{book.author}</Text>

          {/* Badges row */}
          <View className="flex-row gap-2 mb-3 flex-wrap">
            {book.availabilityMode ? (
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
            ) : null}
            {isOutOfStock ? (
              <View className="bg-error/10 px-2.5 py-1 rounded-md">
                <Text className="text-xs font-semibold text-error">স্টক নেই</Text>
              </View>
            ) : null}
          </View>

          {/* Rating */}
          {book.rating > 0 ? (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text className="text-sm font-bold text-text-primary">{book.rating.toFixed(1)}</Text>
              <Text className="text-sm text-text-muted">({book.reviewCount} রিভিউ)</Text>
            </View>
          ) : null}

          {/* Price */}
          <View className="flex-row flex-wrap items-center justify-between gap-2 mt-3 mb-4 py-3 border-y border-border-light">
            {book.availabilityMode === "borrow" ? (
              <Text className="text-2xl font-bold text-borrow">ধার নিন</Text>
            ) : book.availabilityMode === "exchange" ? (
              <Text className="text-2xl font-bold text-exchange">বিনিময় করুন</Text>
            ) : Number(book.price ?? 0) > 0 ? (
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-2xl font-bold text-primary">৳{Number(book.price)}</Text>
                {Number(book.originalPrice ?? 0) > Number(book.price ?? 0) ? (
                  <>
                    <Text className="text-base text-text-muted line-through">৳{Number(book.originalPrice)}</Text>
                    <View className="bg-primary/10 rounded-full px-2.5 py-1">
                      <Text className="text-xs font-bold text-primary">
                        {Math.round((1 - Number(book.price) / Number(book.originalPrice)) * 100)}% ছাড়
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : (
              <Text className="text-2xl font-bold text-success">বিনামূল্যে</Text>
            )}
            {conditionLabel ? (
              <View style={{ backgroundColor: conditionLabel.color + "20" }} className="px-2.5 py-1 rounded-md">
                <Text style={{ color: conditionLabel.color }} className="text-xs font-semibold">
                  {conditionLabel.label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Seller / Owner Info Card */}
          {Boolean((book as any).owner || book.sellerId) ? (
            <View className="mb-2">
              <View className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleViewSellerProfile}
                  activeOpacity={0.7}
                  className="flex-row items-center flex-1 mr-2"
                >
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3 overflow-hidden border border-primary/20">
                    {(book as any).owner?.avatarUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl((book as any).owner.avatarUrl) }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={24} color={Colors.primary} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-sm font-bold text-text-primary flex-shrink" numberOfLines={2}>
                        {(book as any).owner?.name || (book as any).sellerName || "বইবিক্রেতা"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                    </View>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {book.isVerifiedUser ? "যাচাইকৃত বিক্রেতা" : "বিক্রেতার প্রোফাইল"}
                    </Text>
                  </View>
                </TouchableOpacity>
                {!isOwner ? (
                  <TouchableOpacity
                    onPress={handleMessageOwner}
                    disabled={creatingChat}
                    className="flex-row items-center bg-primary px-3 py-2 rounded-xl"
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white ml-1">মেসেজ</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              </View>
            </View>
          ) : null}

          {/* Location */}
          {book.location ? (
            <View className="flex-row flex-wrap items-center gap-2 mb-4 px-4 py-3 rounded-2xl border border-border-light">
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text className="text-sm text-text-secondary">অবস্থান · {book.location}</Text>
              {book.distance ? (
                <Text className="text-sm text-text-muted">({book.distance})</Text>
              ) : null}
            </View>
          ) : null}

          {isOutOfStock ? (
            <View className="bg-error/10 rounded-xl px-4 py-3 mb-5 flex-row items-center gap-2">
              <Ionicons name="information-circle-outline" size={18} color={Colors.error} />
              <Text className="text-sm font-semibold text-error">এই বইটি এখন স্টকে নেই</Text>
            </View>
          ) : null}

          {!isOwner && canBuy && (canExchange || canBorrow) ? (
            <View className="flex-row flex-wrap gap-2 mb-5">
              {canExchange ? <TouchableOpacity onPress={handleExchange} accessibilityRole="button" className="border border-primary rounded-full px-4 py-2"><Text className="text-primary text-sm font-semibold">বিনিময়ের প্রস্তাব</Text></TouchableOpacity> : null}
              {canBorrow ? <TouchableOpacity onPress={handleBorrow} accessibilityRole="button" className="border border-primary rounded-full px-4 py-2"><Text className="text-primary text-sm font-semibold">ধার নিন</Text></TouchableOpacity> : null}
            </View>
          ) : null}

          {book.description ? (
            <View className="mb-6 border-t border-border-light pt-5">
              <Text className="text-base font-bold text-secondary mb-2">বই সম্পর্কে</Text>
              <Text className="text-sm text-text-secondary leading-6" numberOfLines={descriptionExpanded ? undefined : 4}>
                {book.description}
              </Text>
              {book.description.length > 180 ? (
                <TouchableOpacity onPress={() => setDescriptionExpanded((value) => !value)} accessibilityRole="button" className="self-start mt-2 py-1">
                  <Text className="text-sm font-bold text-primary">{descriptionExpanded ? "কম দেখুন" : "আরও পড়ুন"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {[book.publisher, book.language, book.pages, book.edition, book.isbn].some(Boolean) ? (
            <View className="mb-6 border-t border-border-light pt-5">
              <Text className="text-base font-bold text-secondary mb-3">বইয়ের তথ্য</Text>
              <View className="bg-surface-dark rounded-2xl px-4 py-1 border border-border-light">
                {[
                  ["প্রকাশনী", book.publisher], ["ভাষা", book.language],
                  ["পৃষ্ঠা", book.pages], ["সংস্করণ", book.edition], ["ISBN", book.isbn],
                ].filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== 0).map(([label, value]) => (
                  <View key={String(label)} className="flex-row justify-between items-start py-2.5 gap-4">
                    <Text className="text-sm text-text-secondary">{label}</Text>
                    <Text className="text-sm font-semibold text-text-primary flex-shrink text-right">{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Tags */}
          {Array.isArray(book.tags) && book.tags.length > 0 ? (
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
          ) : null}

          {"recommended" in book && Array.isArray(book.recommended) && book.recommended.length > 0 ? (
            <BookHorizontalList title="এ ধরনের আরও বই" books={book.recommended} />
          ) : null}

          {/* More from Seller */}
          {sellerBooks && sellerBooks.length > 0 ? (
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-text-primary">
                  এই বিক্রেতার আরো বই
                </Text>
                <TouchableOpacity
                  onPress={handleViewSellerProfile}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-xs font-semibold text-primary">সব দেখুন</Text>
                </TouchableOpacity>
              </View>
              {sellerBooks.slice(0, 3).map((b) => (
                <BookCard key={b.id} book={b} variant="list" />
              ))}
            </View>
          ) : null}

          {/* Customer Reviews Section */}
          <View className="mb-6 pt-5 border-t border-border-light">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-text-primary">পাঠকদের রিভিউ ও রেটিং</Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  {reviewsLoading ? "রিভিউ লোড হচ্ছে..." : reviewsError ? "রিভিউ লোড করা যায়নি" : `${reviewsData?.length ?? 0}টি রিভিউ পাওয়া গেছে`}
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
            {reviewsLoading ? <ActivityIndicator color={Colors.primary} className="my-4" /> : reviewsError ? (
              <TouchableOpacity onPress={() => refetchReviews()} className="bg-surface-dark rounded-2xl p-5 items-center border border-border-light">
                <Text className="text-sm font-semibold text-primary">রিভিউ আবার লোড করুন</Text>
              </TouchableOpacity>
            ) : reviewsData && reviewsData.length > 0 ? (
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

                    {/* Like / Upvote Button */}
                    <TouchableOpacity
                      onPress={() => handleVoteReview(rev.id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center mt-2.5 pt-2 border-t border-border-light self-start px-2 py-1 rounded-lg ${
                        rev.userVote === "upvote" ? "bg-primary/10" : ""
                      }`}
                    >
                      <Ionicons
                        name={rev.userVote === "upvote" ? "thumbs-up" : "thumbs-up-outline"}
                        size={14}
                        color={rev.userVote === "upvote" ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        className={`text-xs ml-1.5 ${
                          rev.userVote === "upvote" ? "font-bold text-primary" : "text-text-muted"
                        }`}
                      >
                        {rev.likesCount ?? 0} জন সহমত
                      </Text>
                    </TouchableOpacity>
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

      {(isOwner || canBuy || canBorrow || canExchange) ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="bg-white border-t border-border-light px-4 pt-3">
          {isOwner ? (
            <Button label="সম্পাদনা করুন" onPress={() => router.push({ pathname: "/upload" as never, params: { bookId: book.id } })} variant="outline" leftIcon={<Ionicons name="pencil-outline" size={18} color={Colors.primary} />} />
          ) : (
            <View className="flex-row gap-2">
              {canBuy ? <View className="flex-1"><Button label="Add to Cart" leftIcon={<Ionicons name="cart-outline" size={18} color={Colors.primary} />} onPress={handleAddToCart} variant="outline" /></View> : null}
              {canBuy ? <View className="flex-1"><Button label="এখনই কিনুন" onPress={handleBuyNow} /></View> : null}
              {!canBuy && canExchange ? <View className="flex-1"><Button label="বিনিময়ের প্রস্তাব" onPress={handleExchange} /></View> : null}
              {!canBuy && canBorrow ? <View className="flex-1"><Button label="ধার নিন" onPress={handleBorrow} variant={canExchange ? "outline" : "primary"} /></View> : null}
            </View>
          )}
        </View>
      ) : null}

      {/* Write Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="none"
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
      {/* PDF Preview Modal */}
      <Modal
        visible={showPdfModal}
        animationType="none"
        transparent
        onRequestClose={() => setShowPdfModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(20, 31, 25, 0.68)", paddingTop: Math.max(insets.top, 12) }}>
        <View style={{ flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" }}>
          <View className="flex-row items-center px-4 py-2 bg-white border-b border-border-light">
            <Ionicons name="book-outline" size={20} color={Colors.primary} />
            <Text className="flex-1 text-sm font-bold text-text-primary ml-2" numberOfLines={1}>{book.title}</Text>
            <View className="bg-primary/10 rounded-full px-3 py-1 mr-2">
              <Text className="text-xs font-bold text-primary">প্রিভিউ</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="প্রিভিউ বন্ধ করুন"
              onPress={() => setShowPdfModal(false)} className="w-10 h-10 rounded-xl border border-border-light bg-surface-dark items-center justify-center">
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {Platform.OS === "web" ? (
            <iframe title="Book PDF Preview" srcDoc={pdfReaderHtml(previewUrl)}
              style={{ flex: 1, width: "100%", border: 0 }} />
          ) : (
            <WebView
              key={`${previewUrl}-${pdfRetry}`}
              originWhitelist={["*"]}
              source={{ html: pdfReaderHtml(previewUrl), baseUrl: "https://cdnjs.cloudflare.com/" }}
              style={{ flex: 1, backgroundColor: Colors.background }}
              startInLoadingState
              renderLoading={() => (
                <View className="absolute inset-0 items-center justify-center bg-surface-dark">
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text className="text-sm text-text-secondary mt-3">প্রিভিউ লোড হচ্ছে...</Text>
                </View>
              )}
              renderError={() => (
                <View className="flex-1 items-center justify-center p-6 bg-surface-dark">
                  <Text className="text-base font-semibold text-text-primary text-center mb-4">প্রিভিউ লোড হয়নি</Text>
                  <Button label="আবার চেষ্টা করুন" onPress={() => setPdfRetry((count) => count + 1)} fullWidth={false} />
                </View>
              )}
            />
          )}
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="bg-white border-t border-border-light px-4 pt-3 flex-row items-center gap-3">
            <Text className="flex-1 text-xs text-text-secondary">স্ক্রল করে পৃষ্ঠাগুলো পড়ুন</Text>
            {canBuy && !isOwner ? (
              <TouchableOpacity accessibilityRole="button" onPress={() => { setShowPdfModal(false); handleBuyNow(); }}
                className="bg-primary rounded-lg px-4 py-3 items-center justify-center">
                <Text className="text-sm font-bold text-white">বইটি কিনুন {Number(book.price) > 0 ? `(৳${Number(book.price)})` : ""}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        </View>
      </Modal>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        animationType="none"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View className="flex-1 bg-black items-center justify-center relative">
          <TouchableOpacity
            onPress={() => setFullScreenImage(null)}
            style={{ top: insets.top + 16 }}
            className="absolute right-5 w-10 h-10 rounded-full bg-white/20 items-center justify-center z-10"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: resolveMediaUrl(fullScreenImage) }}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
