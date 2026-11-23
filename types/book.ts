// Types (migrated from web frontend)
export type BookAvailabilityMode =
  | "sell"
  | "exchange"
  | "borrow"
  | "wishlist"
  | "collection"
  | "library";

export type BookCondition = "new" | "excellent" | "good" | "fair" | "poor";

export type BookAvailabilityStatus = "in-stock" | "out-of-stock";

export type BookCardBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorSlug?: string;
  authorNameBn?: string;
  coverUrl: string;
  tags: string[];
  availabilityMode?: BookAvailabilityMode;
  rating: number;
  reviewCount: number;
  price?: number | string;
  originalPrice?: number | string;
  original_price?: number | string;
  distance?: string;
  location?: string;
  condition: BookCondition;
  availability:
    | BookAvailabilityStatus
    | { sell?: number; exchange?: number; borrow?: number };
  isOutOfStock?: boolean;
  quantity?: number;
  inventory_status?: string;
  inventoryStatus?: string;
  isWishlisted?: boolean;
  isInCart?: boolean;
  providerType?: "library" | "user";
  isVerifiedUser?: boolean;
  exchangePrice?: number | string;
  exchange_price?: number | string;
  exchangePreferences?: string[];
  hasPreviewPdf?: boolean;
  previewPdfUrl?: string;
  previewPdfPages?: number;
  sellerId?: string;
  ownerId?: string;
};

export type BookGalleryImage = {
  src: string;
  alt: string;
};

export type BookCategory = {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  count?: number;
};

export type BookConditionLabel = {
  value: BookCondition;
  label: string;
  labelBn: string;
  color: string;
};

export const BOOK_CONDITION_LABELS: BookConditionLabel[] = [
  { value: "new", label: "New", labelBn: "নতুন", color: "#10B981" },
  { value: "excellent", label: "Like New", labelBn: "অতি উত্তম", color: "#3B82F6" },
  { value: "good", label: "Good", labelBn: "ভালো", color: "#8B5CF6" },
  { value: "fair", label: "Fair", labelBn: "মোটামুটি", color: "#F59E0B" },
  { value: "poor", label: "Poor", labelBn: "খারাপ", color: "#EF4444" },
];
