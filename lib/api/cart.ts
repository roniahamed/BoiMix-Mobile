import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook } from "@/types/book";

export type CartItemResponse = BookCardBook & {
  item_id: string;
  listing_id: string;
  quantity: number;
  selected: boolean;
};

export type CartResponse = {
  id: string;
  items: CartItemResponse[];
  subtotal: number;
  total_items: number;
};

export const cartApi = {
  getCart: () =>
    apiClient.get<CartResponse>(API_ENDPOINTS.ME.CART),

  addItem: (listingId: string, quantity = 1) =>
    apiClient.post(API_ENDPOINTS.ME.CART_ITEMS, {
      listing_id: listingId,
      quantity,
    }),

  updateItem: (itemId: string, changes: { quantity?: number; selected?: boolean }) =>
    apiClient.patch(API_ENDPOINTS.ME.CART_ITEM(itemId), changes),

  removeItem: (itemId: string) =>
    apiClient.delete(API_ENDPOINTS.ME.CART_ITEM(itemId)),

  clearCart: () => apiClient.delete(API_ENDPOINTS.ME.CART),
};
