import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";

export type CartItemResponse = {
  id: string;
  listingId: string;
  quantity: number;
  price: number;
  book?: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
};

export type CartResponse = {
  id: string;
  items: CartItemResponse[];
  subtotal: number;
  total: number;
};

export const cartApi = {
  getCart: () =>
    apiClient.get<CartResponse>(API_ENDPOINTS.ME.CART),

  addItem: (listingId: string, quantity = 1) =>
    apiClient.post(API_ENDPOINTS.ME.CART_ITEMS, {
      listing_id: listingId,
      quantity,
    }),

  updateQuantity: (itemId: string, quantity: number) =>
    apiClient.patch(API_ENDPOINTS.ME.CART_ITEM(itemId), { quantity }),

  removeItem: (itemId: string) =>
    apiClient.delete(API_ENDPOINTS.ME.CART_ITEM(itemId)),
};
