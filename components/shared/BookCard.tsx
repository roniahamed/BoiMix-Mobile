import { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { BookCardBook } from "@/types/book";
import { BOOK_CONDITION_LABELS } from "@/types/book";
import { resolveMediaUrl } from "@/lib/utils/media";
import { AddToCartButton } from "@/components/shared/AddToCartButton";


type Variant = "grid" | "horizontal" | "list";

type BookCardProps = {
  book: BookCardBook;
  variant?: Variant;
  onPress?: () => void;
  onWishlistToggle?: (bookId: string, current: boolean) => void;
};

function AvailabilityBadge({ mode }: { mode?: BookCardBook["availabilityMode"] }) {
  if (!mode) return null;
  const config: Record<string, { label: string; color: string }> = {
    sell: { label: "বিক্রয়", color: Colors.sell },
    exchange: { label: "বিনিময়", color: Colors.exchange },
    borrow: { label: "ধার", color: Colors.borrow },
    library: { label: "লাইব্রেরি", color: Colors.library },
  };
  const cfg = config[mode];
  if (!cfg) return null;
  return (
    <View
      style={{ backgroundColor: cfg.color + "20", borderColor: cfg.color }}
      className="border rounded px-1.5 py-0.5"
    >
      <Text style={{ color: cfg.color }} className="text-xs font-semibold">
        {cfg.label}
      </Text>
    </View>
  );
}

function ConditionBadge({ condition }: { condition: BookCardBook["condition"] }) {
  const cfg = BOOK_CONDITION_LABELS.find((c) => c.value === condition);
  if (!cfg) return null;
  return (
    <View
      style={{ backgroundColor: condition === "new" ? "#DDF3D5" : "#FFF1C9" }}
      className="rounded px-1.5 py-0.5"
    >
      <Text style={{ color: condition === "new" ? Colors.primary : "#684C18" }} className="text-xs font-medium">
        {cfg.label}
      </Text>
    </View>
  );
}

function PriceTag({ book }: { book: BookCardBook }) {
  if (book.availabilityMode === "borrow") {
    return <Text className="text-sm font-bold text-borrow">ধার</Text>;
  }
  if (book.availabilityMode === "exchange") {
    return <Text className="text-sm font-bold text-exchange">বিনিময়</Text>;
  }
  const price = Number(book.price ?? 0);
  const origPrice = Number(book.originalPrice ?? 0);

  if (!price) {
    return <Text className="text-sm font-bold text-success">বিনামূল্যে</Text>;
  }
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-sm font-bold text-primary">৳{price}</Text>
      {origPrice > price && (
        <Text className="text-xs text-text-muted line-through">
          ৳{origPrice}
        </Text>
      )}
    </View>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="star" size={13} color={Colors.warning} />
      <Text className="text-xs font-medium text-text-primary">{rating.toFixed(1)}</Text>
      {count > 0 && (
        <Text className="text-xs text-text-muted">({count})</Text>
      )}
    </View>
  );
}

function getCoverUrl(book: BookCardBook): string {
  const url =
    book.coverUrl ||
    (book as any).cover_image_url ||
    (book as any).cover_image ||
    (book as any).coverImage ||
    (book as any).image;
  return resolveMediaUrl(url);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function BookCardSkeleton({ variant = "grid" }: { variant?: Variant }) {
  const { width } = useWindowDimensions();
  const gridCardWidth = (width - 48) / 2;
  if (variant === "horizontal") {
    return (
      <View style={{ width: Math.max(120, (width - 32 - 8 * 2.2) / 2.2) }} className="mr-2 animate-pulse">
        <View className="w-full h-44 bg-border rounded-xl mb-2" />
        <View className="h-3 bg-border rounded w-full mb-1" />
        <View className="h-3 bg-border rounded w-3/4" />
      </View>
    );
  }
  return (
    <View style={{ width: gridCardWidth }} className="animate-pulse mb-4">
      <View className="h-48 bg-border rounded-xl mb-2" />
      <View className="h-3 bg-border rounded w-full mb-1" />
      <View className="h-3 bg-border rounded w-3/4" />
    </View>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
function BookCardBase({
  book,
  variant = "grid",
  onPress,
  onWishlistToggle,
}: BookCardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const gridCardWidth = (width - 48) / 2;
  const shelfCardWidth = Math.max(120, (width - 32 - 8 * 2.2) / 2.2);
  const isOutOfStock = book.isOutOfStock || book.availability === "out-of-stock";
  const price = Number(book.price ?? 0);
  const origPrice = Number(book.originalPrice ?? 0);
  const discountPercent =
    origPrice > price && price > 0
      ? Math.round(((origPrice - price) / origPrice) * 100)
      : 0;
  const coverUri = getCoverUrl(book);

  const handlePress = () => {
    if (onPress) return onPress();
    const target = book.slug || book.id;
    if (target) {
      router.push(`/book/${target}` as never);
    }
  };

  // ── Horizontal (small) ──────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={{ width: shelfCardWidth }}
        className="mr-2 bg-white rounded-xl p-1.5 border border-border-light"
      >
        <View className="relative mb-2">
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={{ width: "100%", height: shelfCardWidth * 1.12, borderRadius: 10, backgroundColor: "#E9E6DC" }}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View
              style={{ width: "100%", height: shelfCardWidth * 1.12, borderRadius: 10, backgroundColor: "#E9E6DC" }}
              className="bg-slate-100 items-center justify-center border border-slate-200"
            >
              <Ionicons name="book-outline" size={36} color={Colors.textMuted} />
              <Text className="text-[10px] text-text-muted mt-1.5 font-medium">প্রচ্ছদ নেই</Text>
            </View>
          )}
          {discountPercent >= 5 && (
            <View className="absolute bottom-1.5 left-1.5 bg-rose-600 rounded px-1.5 py-0.5 shadow-xs">
              <Text className="text-[10px] font-bold text-white">-{discountPercent}%</Text>
            </View>
          )}
          {isOutOfStock && (
            <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
              <Text className="text-white text-xs font-bold">স্টক নেই</Text>
            </View>
          )}
          {book.condition && (
            <View className="absolute bottom-1.5 left-1.5"><ConditionBadge condition={book.condition} /></View>
          )}
          {/* Wishlist */}
          {onWishlistToggle && (
            <TouchableOpacity
              onPress={(event) => { event.stopPropagation(); onWishlistToggle(book.id, !!book.isWishlisted); }}
              accessibilityRole="button" accessibilityLabel={book.isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় যোগ করুন"}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons
                name={book.isWishlisted ? "heart" : "heart-outline"}
                size={16}
                color={book.isWishlisted ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
          {book.title}
        </Text>
        <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
          {book.author}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-1"><PriceTag book={book} />
            {!!book.location && <View className="flex-row items-center mt-1"><Ionicons name="location-outline" size={12} color={Colors.textSecondary} /><Text className="text-xs text-text-secondary ml-1 flex-1" numberOfLines={1}>{book.location}</Text></View>}
          </View>

        </View>
        <AddToCartButton book={book} />
      </TouchableOpacity>
    );
  }

  // ── List (full width) ───────────────────────────────────────────────────
  if (variant === "list") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="flex-row bg-white border border-border rounded-xl p-3 mb-3 shadow-sm"
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: 72, height: 100, borderRadius: 8 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{ width: 72, height: 100, borderRadius: 8 }}
            className="bg-slate-100 items-center justify-center border border-slate-200"
          >
            <Ionicons name="book-outline" size={24} color={Colors.textMuted} />
            <Text className="text-[9px] text-text-muted mt-1 font-medium">প্রচ্ছদ নেই</Text>
          </View>
        )}
        <View className="flex-1 ml-3 justify-between">
          <View>
            <Text className="text-sm font-semibold text-text-primary leading-5" numberOfLines={2}>
              {book.title}
            </Text>
            <Text className="text-xs text-text-secondary mt-0.5">{book.author}</Text>
            <StarRating rating={book.rating} count={book.reviewCount} />
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <PriceTag book={book} />
            <View className="flex-row gap-1">
              <ConditionBadge condition={book.condition} />
            </View>
          </View>
          {book.distance && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text className="text-xs text-text-muted">{book.distance}</Text>
            </View>
          )}
          <AddToCartButton book={book} />
        </View>
      </TouchableOpacity>
    );
  }

  // ── Grid (2-column default) ─────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={{ width: gridCardWidth }}
      className="mb-4 bg-white rounded-2xl p-2 border border-border-light shadow-sm"
    >
      {/* Cover */}
      <View className="relative mb-2">
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: "100%", height: gridCardWidth * 1.35, borderRadius: 10 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{ width: "100%", height: gridCardWidth * 1.35, borderRadius: 10 }}
            className="bg-slate-100 items-center justify-center border border-slate-200"
          >
            <Ionicons name="book-outline" size={40} color={Colors.textMuted} />
            <Text className="text-[11px] text-text-muted mt-1.5 font-medium">প্রচ্ছদ নেই</Text>
          </View>
        )}

        {discountPercent >= 5 && (
          <View className="absolute bottom-2 left-2 bg-rose-600 rounded px-1.5 py-0.5 shadow-xs">
            <Text className="text-[10px] font-bold text-white">-{discountPercent}%</Text>
          </View>
        )}

        {isOutOfStock && (
          <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
            <Text className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">
              স্টক নেই
            </Text>
          </View>
        )}

        {book.availabilityMode && (
          <View className="absolute top-2 left-2">
            <AvailabilityBadge mode={book.availabilityMode} />
          </View>
        )}

        {onWishlistToggle && (
          <TouchableOpacity
            onPress={() => onWishlistToggle(book.id, !!book.isWishlisted)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full items-center justify-center shadow"
          >
            <Ionicons
              name={book.isWishlisted ? "heart" : "heart-outline"}
              size={16}
              color={book.isWishlisted ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {book.isVerifiedUser && (
          <View className="absolute bottom-2 right-2 bg-white/90 rounded-full p-0.5">
            <Ionicons name="checkmark-circle" size={16} color={Colors.info} />
          </View>
        )}
      </View>

      {/* Info */}
      <Text
        className="text-sm font-semibold text-text-primary leading-5"
        numberOfLines={2}
      >
        {book.title}
      </Text>
      <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
        {book.author}
      </Text>

      <View className="flex-row items-center justify-between mt-1.5">
        <PriceTag book={book} />
        <ConditionBadge condition={book.condition} />
      </View>

      {book.rating > 0 && (
        <View className="mt-1">
          <StarRating rating={book.rating} count={book.reviewCount} />
        </View>
      )}

      {book.distance && (
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
          <Text className="text-xs text-text-muted">{book.distance}</Text>
        </View>
      )}
      <AddToCartButton book={book} />
    </TouchableOpacity>
  );
}

export const BookCard = memo(BookCardBase);
export default BookCard;
