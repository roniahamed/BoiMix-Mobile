import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook } from "@/types/book";
export type WishlistResponse = {
  id: string;
  items: { id: string; listing_id: string; book: BookCardBook; created_at: string }[];
  item_ids: string[];
  total_items: number;
};
export type WishlistItemsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WishlistResponse["items"];
};

export const wishlistApi = {
  getWishlist: () => apiClient.get<WishlistResponse>(API_ENDPOINTS.ME.WISHLIST),
  getWishlistItems: (page: number, pageSize = 20) =>
    apiClient.get<WishlistItemsPage>(API_ENDPOINTS.ME.WISHLIST_ITEMS, { params: { page, page_size: pageSize } }),

  toggleWishlist: (listingId: string) =>
    apiClient.post<{ in_wishlist: boolean }>(API_ENDPOINTS.ME.WISHLIST_TOGGLE, {
      listing_id: listingId,
    }),

  addItem: (listingId: string) =>
    apiClient.post(API_ENDPOINTS.ME.WISHLIST_ITEMS, { listing_id: listingId }),

  removeItem: (listingId: string) =>
    apiClient.delete(API_ENDPOINTS.ME.WISHLIST_ITEM(listingId)),
};
