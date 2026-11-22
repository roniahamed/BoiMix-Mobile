import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook } from "@/types/book";
import type { PaginatedResponse } from "@/lib/api/books";

export const wishlistApi = {
  getWishlist: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.ME.WISHLIST, {
      params,
    }),

  toggleWishlist: (listingId: string) =>
    apiClient.post<{ is_wishlisted: boolean }>(API_ENDPOINTS.ME.WISHLIST_TOGGLE, {
      listing_id: listingId,
    }),

  addItem: (listingId: string) =>
    apiClient.post(API_ENDPOINTS.ME.WISHLIST_ITEMS, { listing_id: listingId }),

  removeItem: (listingId: string) =>
    apiClient.delete(API_ENDPOINTS.ME.WISHLIST_ITEM(listingId)),
};
