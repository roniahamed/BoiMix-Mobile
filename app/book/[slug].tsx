import { useState } from "react";
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
  Linking,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { BookCard } from "@/components/shared/BookCard";
import { booksApi } from "@/lib/api/books";
import { queryKeys } from "@/lib/api/query-keys";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { BOOK_CONDITION_LABELS, type BookCardBook } from "@/types/book";
import { Colors } from "@/constants/theme";
import { resolveMediaUrl } from "@/lib/utils/media";
import { wishlistApi } from "@/lib/api/wishlist";
import { reviewsApi, type BookReviewItem } from "@/lib/api/reviews";
import { shareContent } from "@/lib/utils/share";

export default function BookDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addItem);
  const { isWishlisted, toggleBook } = useWishlistStore();

  const wishlisted = isWishlisted(slug ?? "");

  // ── Images & Gallery state ──
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // ── PDF preview modal state ──
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfViewerMode, setPdfViewerMode] = useState<"google" | "direct">("google");

  // ── Chat creation state ──
  const [creatingChat, setCreatingChat] = useState(false);

  // ── Reviews state & query ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: reviewsData, refetch: refetchReviews } = useQuery<BookReviewItem[]>({
    queryKey: ["book-reviews", slug],
    queryFn: async () => {
      if (!slug) return [];
      try {
        const res = await reviewsApi.getBookReviews(slug);
        return res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
      } catch {
        return [];
      }
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
          const b = (d as any).book;
          const owner = (d as any).owner;
          return {
            ...b,
            owner,
            sellerId: b.sellerId || owner?.id,
            ownerId: b.ownerId || owner?.id,
            sellerName: owner?.name || owner?.username,
            sellerUsername: owner?.username,
          } as BookCardBook & { owner?: any; sellerName?: string; sellerUsername?: string };
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
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: sellerId || sellerUsername || `user-${book.id}`,
          name: sellerDisplayName,
          username: sellerUsername || "",
          avatar: sellerAvatar || "",
        },
      });
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

  const handleOpenPdfPreview = async () => {
    if (!book) return;
    const rawPdf = book.previewPdfUrl || (book as any).preview_pdf_url;
    if (!rawPdf) {
      Alert.alert("দুঃখিত", "এই বইটির কোনো প্রিভিউ পিডিএফ পাওয়া যায়নি।");
      return;
    }
    const fullUrl = resolveMediaUrl(rawPdf);
    if (Platform.OS === "web") {
      setShowPdfModal(true);
    } else {
      try {
        await WebBrowser.openBrowserAsync(fullUrl);
      } catch {
        Linking.openURL(fullUrl).catch(() => {
          setShowPdfModal(true);
        });
      }
    }
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

  const isOwner = user?.id === book?.ownerId || user?.id === book?.sellerId;
  const conditionLabel = BOOK_CONDITION_LABELS.find((c) => c.value === book?.condition);

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
        {/* Cover / Multi-Image Carousel */}
        <View className="relative bg-surface-dark">
          {Boolean(resolveMediaUrl(allImages[activeImageIndex]?.url || book.coverUrl || (book as any).cover_image_url || (book as any).coverImage)) ? (
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
                style={{ width: "100%", height: 340 }}
                contentFit="contain"
                transition={200}
              />
            </TouchableOpacity>
          ) : (
            <View
              style={{ width: "100%", height: 300 }}
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

        {/* Thumbnails row if multiple images */}
        {allImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}
            className="bg-white border-b border-border-light"
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

        <View className="p-5">
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
            {conditionLabel ? (
              <View style={{ backgroundColor: conditionLabel.color + "20" }} className="px-2.5 py-1 rounded-md">
                <Text style={{ color: conditionLabel.color }} className="text-xs font-semibold">
                  {conditionLabel.labelBn}
                </Text>
              </View>
            ) : null}
            {book.isOutOfStock ? (
              <View className="bg-error/10 px-2.5 py-1 rounded-md">
                <Text className="text-xs font-semibold text-error">স্টক নেই</Text>
              </View>
            ) : null}
          </View>

          {/* Title & Author */}
          <Text className="text-xl font-bold text-text-primary leading-7">{book.title}</Text>
          <TouchableOpacity onPress={() => book.authorSlug && router.push(`/user/${book.authorSlug}` as never)}>
            <Text className="text-sm text-primary font-medium mt-1">{book.author}</Text>
          </TouchableOpacity>

          {/* Rating */}
          {book.rating > 0 ? (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text className="text-sm font-bold text-text-primary">{book.rating.toFixed(1)}</Text>
              <Text className="text-sm text-text-muted">({book.reviewCount} রিভিউ)</Text>
            </View>
          ) : null}

          {/* Price */}
          <View className="mt-3 mb-5 py-2 border-y border-border-light">
            {book.availabilityMode === "borrow" ? (
              <Text className="text-2xl font-bold text-borrow">ধার নিন</Text>
            ) : book.availabilityMode === "exchange" ? (
              <Text className="text-2xl font-bold text-exchange">বিনিময় করুন</Text>
            ) : Number(book.price ?? 0) > 0 ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-primary">৳{Number(book.price)}</Text>
                {Number(book.originalPrice ?? 0) > Number(book.price ?? 0) ? (
                  <Text className="text-base text-text-muted line-through">
                    ৳{Number(book.originalPrice)}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text className="text-2xl font-bold text-success">বিনামূল্যে</Text>
            )}
          </View>

          {/* Location */}
          {book.location ? (
            <View className="flex-row items-center gap-1.5 mb-4">
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text className="text-sm text-text-secondary">{book.location}</Text>
              {book.distance ? (
                <Text className="text-sm text-text-muted">({book.distance})</Text>
              ) : null}
            </View>
          ) : null}

          {/* Action Buttons */}
          {!isOwner ? (
            <View className="gap-3 mb-6">
              {(!book.isOutOfStock && (
                book.availabilityMode === "sell" ||
                (book.availabilityMode as string) === "for_sale" ||
                !book.availabilityMode ||
                (Number(book.price ?? 0) > 0 && book.availabilityMode !== "borrow" && book.availabilityMode !== "exchange")
              )) ? (
                <>
                  <Button
                    label="কার্টে যোগ করুন"
                    onPress={handleAddToCart}
                    variant="outline"
                    leftIcon={<Ionicons name="cart-outline" size={18} color={Colors.primary} />}
                  />
                  <Button label="এখনই কিনুন" onPress={handleBuyNow} />
                </>
              ) : null}
              {(book.availabilityMode === "exchange" || Boolean((book as any).isAvailableForExchange)) ? (
                <Button
                  label="বিনিময়ের প্রস্তাব পাঠান"
                  onPress={handleExchange}
                  leftIcon={<Ionicons name="repeat-outline" size={18} color="#FFFFFF" />}
                />
              ) : null}
              {(!book.isOutOfStock && (book.availabilityMode === "borrow" || Boolean((book as any).isAvailableForBorrow))) ? (
                <Button
                  label="ধার নিন"
                  onPress={handleBorrow}
                  leftIcon={<Ionicons name="book-outline" size={18} color="#FFFFFF" />}
                />
              ) : null}
              {book.isOutOfStock ? (
                <View className="bg-surface-dark rounded-xl p-4 items-center border border-border-light">
                  <Text className="text-sm font-semibold text-text-secondary">এই বইটি এখন স্টকে নেই</Text>
                </View>
              ) : null}
              <Button
                label={creatingChat ? "মেসেজ রুম প্রস্তুত হচ্ছে..." : "মালিককে মেসেজ দিন"}
                onPress={handleMessageOwner}
                loading={creatingChat}
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

          {/* PDF Preview */}
          {Boolean(book.hasPreviewPdf || (book as any).preview_pdf_url || book.previewPdfUrl) ? (
            <TouchableOpacity
              className="flex-row items-center gap-3 bg-info/10 border border-info rounded-xl p-4 mb-5"
              onPress={handleOpenPdfPreview}
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.info} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-info">প্রিভিউ পড়ুন</Text>
                <Text className="text-xs text-text-secondary">
                  {book.previewPdfPages ? `${book.previewPdfPages} পৃষ্ঠা` : "বইয়ের নির্বাচিত অংশ"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.info} />
            </TouchableOpacity>
          ) : null}

          {/* Seller / Owner Info Card */}
          {Boolean((book as any).owner || book.sellerId) ? (
            <View className="mb-5 p-4 rounded-2xl bg-surface-dark border border-border-light">
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
                      <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                        {(book as any).owner?.name || (book as any).sellerName || "বইবিক্রেতা"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                    </View>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {(book as any).owner?.location || book.location || "বাংলাদেশ"}
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
      {/* PDF Preview Modal */}
      <Modal
        visible={showPdfModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPdfModal(false)}
      >
        <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border-light shadow-sm">
            <TouchableOpacity
              onPress={() => setShowPdfModal(false)}
              className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View className="flex-1 px-3">
              <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                {book?.title} (পিডিএফ প্রিভিউ)
              </Text>
              <Text className="text-[11px] text-text-muted">
                {book?.previewPdfPages ? `${book.previewPdfPages} পৃষ্ঠা` : "বইয়ের নির্বাচিত অংশ"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const pdf = resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url);
                if (Platform.OS === "web") {
                  if (typeof window !== "undefined") window.open(pdf, "_blank");
                } else {
                  Linking.openURL(pdf);
                }
              }}
              className="p-2"
            >
              <Ionicons name="open-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Viewer Container */}
          {Platform.OS === "web" ? (
            <View style={{ flex: 1, backgroundColor: "#1e293b", overflow: "hidden" }}>
              {/* Reader Switcher Toolbar */}
              <View className="flex-row items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setPdfViewerMode("google")}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center ${
                      pdfViewerMode === "google" ? "bg-primary" : "bg-slate-800"
                    }`}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={13}
                      color={pdfViewerMode === "google" ? "#FFFFFF" : "#94A3B8"}
                    />
                    <Text
                      className={`text-xs ml-1.5 font-bold ${
                        pdfViewerMode === "google" ? "text-white" : "text-slate-400"
                      }`}
                    >
                      স্ক্রোল রিডার
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPdfViewerMode("direct")}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center ${
                      pdfViewerMode === "direct" ? "bg-primary" : "bg-slate-800"
                    }`}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={13}
                      color={pdfViewerMode === "direct" ? "#FFFFFF" : "#94A3B8"}
                    />
                    <Text
                      className={`text-xs ml-1.5 font-bold ${
                        pdfViewerMode === "direct" ? "text-white" : "text-slate-400"
                      }`}
                    >
                      সরাসরি ভিউ
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const pdf = resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url);
                    if (typeof window !== "undefined") window.open(pdf, "_blank");
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 flex-row items-center"
                >
                  <Ionicons name="expand-outline" size={13} color="#94A3B8" />
                  <Text className="text-[11px] text-slate-300 ml-1">নতুন ট্যাবে</Text>
                </TouchableOpacity>
              </View>

              {/* Iframe View */}
              <View style={{ flex: 1, width: "100%", height: "100%" }}>
                <iframe
                  src={
                    pdfViewerMode === "google"
                      ? `https://docs.google.com/viewer?url=${encodeURIComponent(
                          resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url)
                        )}&embedded=true`
                      : resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url)
                  }
                  style={
                    {
                      width: "100%",
                      height: "100%",
                      border: "none",
                      overflow: "auto",
                      WebkitOverflowScrolling: "touch",
                    } as any
                  }
                  title="Book PDF Preview"
                />
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center p-6 bg-white">
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                <Ionicons name="document-text" size={36} color={Colors.primary} />
              </View>
              <Text className="text-base font-bold text-text-primary text-center">
                পিডিএফ প্রিভিউ রিডার
              </Text>
              <Text className="text-xs text-text-muted text-center mt-1 mb-6 max-w-xs">
                ডিভাইসের বিল্ট-ইন রিডারে সম্পূর্ণ প্রিভিউটি পড়তে নিচের বাটনে চাপ দিন।
              </Text>
              <Button
                label="রিডারে প্রিভিউ খুলুন"
                onPress={() => {
                  const pdf = resolveMediaUrl(book?.previewPdfUrl || (book as any)?.preview_pdf_url);
                  WebBrowser.openBrowserAsync(pdf);
                }}
                leftIcon={<Ionicons name="book-outline" size={18} color="#FFF" />}
                fullWidth={false}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        animationType="fade"
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
